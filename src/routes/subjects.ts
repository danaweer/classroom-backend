import { and, ilike, or, sql, eq, getTableColumns, desc,  } from 'drizzle-orm';
import express from 'express';
import { subjects, departments } from '../db/schema';
import { db } from '../db';
import { parse } from 'node:path';

const router = express.Router();

//get all subjects with pagination, filtering and optional search by name
router.get('/', async(req, res) => {
    try {
        const { search, department, page = 1, limit = 10 } = req.query;

        const currentPage = Math.max(1, parseInt(page as string, 10) || 1); // Ensure currentPage is at least 1

        const limitPerPage = Math.min(Math.max(1, parseInt(String(limit), 10) || 10), 100); // Ensure limitPerPage is between 1 and 100

        const offset = (currentPage - 1) * limitPerPage; // Calculate the offset for pagination 

        const filterConditions =[]; //this is where we will build our filter conditions based on the query parameters

         //if search query is provided, we will search for subjects where the name OR code contains the search term (case-insensitive)
        if (search) {
            filterConditions.push(
                or(
                    ilike(subjects.name, `%${search}%`),
                    ilike(subjects.code, `%${search}%`)
                )
            );
        }
        //if department query is provided, we will search for subjects that belong to departments where the name contains the department term (case-insensitive)
        if (department) {
            const deptPattern = `%${String(department).replace(/[%_]/g, '\\$&')}%`; // Escape % and _ characters for SQL LIKE
            filterConditions.push(ilike(departments.name, deptPattern));
        }

        // Combine all filter conditions using AND
        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined; 

        // Get the total count of subjects matching the filters for pagination purposes
        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(subjects)
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause); // Get the total count of subjects matching the filters

        const totalCount = countResult[0]?.count ?? 0; // Extract the count from the result

        //fetching the actual subjects with the applied filters, pagination, and sorting
        const subjectsList = await db
            .select({
                ...getTableColumns(subjects), 
                department: { ...getTableColumns(departments) } 
            }).from(subjects)
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause) // Apply the combined filter conditions
            .orderBy(desc(subjects.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: subjectsList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage)
            }
        })

    } catch (e) {
        console.error(`GET /subjects error: ${e}`);
        res.status(500).json({ error: 'Failed to get subjects' });
    }
})

export default router;