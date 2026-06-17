import { pool } from "../../db";

const createIssuesIntoDB = async (
  payload: any,
  user: { id: number; role: string },
) => {
  const { title, description, type } = payload;

  const reporter_id = user.id;

  const userResult = await pool.query(
    `
    SELECT * FROM users
    WHERE id = $1
    `,
    [reporter_id],
  );

  if (userResult.rows.length === 0) {
    throw new Error("User not found");
  }

  const result = await pool.query(
    `
    INSERT INTO issues
    (
      title,
      description,
      type,
      status,
      reporter_id
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [title, description, type, "open", reporter_id],
  );

  return result.rows[0];
};
const getAllIssuesFromDB = async () => {
  const result = await pool.query(`
    SELECT * FROM issues 
  `);
  return result;
};
const singleIssuesFromDB = async (id : any) => {
  
  
  // console.log("this is service", id)
  const result = await pool.query(
    `
      SELECT * FROM issues WHERE id=$1
    `,
    [id],
  );
  
  return result;
};

const updateIssuesFromDB = async (
  id: string,
  payLoad: { title?: string; description?: string; type?: string },
  user: { id: number; role: "maintainer" | "contributor" },
) => {
  const { title, description, type } = payLoad;

  const checkIssue = await pool.query(
    `SELECT reporter_id, status FROM issues WHERE id = $1`,
    [id],
  );

  if (checkIssue.rows.length === 0) {
    throw new Error("Issue not found");
  }

  const { reporter_id, status } = checkIssue.rows[0];

  const isMaintainer = user.role === "maintainer";
  const isOwner = reporter_id === user.id;
  const isOpen = status === "open";

  if (!isMaintainer && !(isOwner && isOpen)) {
    throw new Error("You do not have permission to update this issue");
  }

  const result = await pool.query(
    `
    UPDATE issues
    SET 
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      type = COALESCE($3, type),
      updated_at = NOW()
    WHERE id = $4
    RETURNING *
    `,
    [title ?? null, description ?? null, type ?? null, id],
  );

  return result.rows[0];
};

export const issuesService = {
  createIssuesIntoDB,
  getAllIssuesFromDB,
  singleIssuesFromDB,
  updateIssuesFromDB,
};
