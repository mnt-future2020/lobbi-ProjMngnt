import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/lib/models/Task";
import Developer from "@/lib/models/Developer";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse Excel or CSV
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
    });

    if (rows.length === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    // Fetch all developers for name matching
    const developers: any[] = await Developer.find().lean();
    const devMap = new Map<string, string>();
    for (const dev of developers) {
      devMap.set(String(dev.name).toLowerCase().trim(), String(dev._id));
    }

    // Map column names (flexible matching)
    const normalize = (key: string) => key.toLowerCase().replace(/[^a-z]/g, "");

    const findCol = (row: Record<string, string>, targets: string[]) => {
      for (const key of Object.keys(row)) {
        const norm = normalize(key);
        if (targets.some((t) => norm.includes(t))) return key;
      }
      return null;
    };

    const firstRow = rows[0];
    const dateCol = findCol(firstRow, ["date"]);
    const taskCol = findCol(firstRow, ["task", "taskname", "title", "name"]);
    const devCol = findCol(firstRow, ["developer", "assigneddeveloper", "assigned", "assignee"]);
    const statusCol = findCol(firstRow, ["status", "staus"]);
    const priorityCol = findCol(firstRow, ["priority"]);
    const dueCol = findCol(firstRow, ["duedate", "due"]);

    if (!taskCol) {
      return NextResponse.json(
        { error: "Could not find a Task/Title column in the file" },
        { status: 400 }
      );
    }

    const validStatuses = ["Pending", "In Progress", "Completed"];
    const validPriorities = ["Low", "Medium", "High"];

    const statusMap: Record<string, string> = {
      completed: "Completed",
      done: "Completed",
      pending: "Pending",
      "in progress": "In Progress",
      inprogress: "In Progress",
      progress: "In Progress",
    };

    const priorityMap: Record<string, string> = {
      low: "Low",
      medium: "Medium",
      high: "High",
      done: "Medium", // fallback
    };

    const parseDate = (val: string | number): Date | null => {
      if (!val) return null;
      // Handle Excel serial date numbers
      if (typeof val === "number") {
        const excelDate = XLSX.SSF.parse_date_code(val);
        if (excelDate) {
          return new Date(excelDate.y, excelDate.m - 1, excelDate.d);
        }
      }
      const str = String(val).trim();
      if (!str || str === "-") return null;
      // Try DD-MM-YYYY or DD/MM/YYYY
      const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
      if (dmyMatch) {
        return new Date(+dmyMatch[3], +dmyMatch[2] - 1, +dmyMatch[1]);
      }
      // Try standard parsing
      const d = new Date(str);
      return isNaN(d.getTime()) ? null : d;
    };

    // Resolve developer - can be comma-separated, take first match
    const resolveDeveloper = (val: string): string | null => {
      if (!val || val === "-") return null;
      const names = val.split(",").map((n) => n.trim().toLowerCase());
      for (const name of names) {
        if (devMap.has(name)) return devMap.get(name)!;
        // Partial match
        let found: string | null = null;
        devMap.forEach((devId, devName) => {
          if (!found && (devName.includes(name) || name.includes(devName))) {
            found = devId;
          }
        });
        if (found) return found;
      }
      return null;
    };

    const tasksToCreate = [];
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const title = String(row[taskCol!] || "").trim();
      if (!title) {
        errors.push(`Row ${i + 2}: Empty task name, skipped`);
        continue;
      }

      const rawStatus = statusCol ? String(row[statusCol] || "").trim().toLowerCase() : "";
      const rawPriority = priorityCol ? String(row[priorityCol] || "").trim().toLowerCase() : "";
      const rawDev = devCol ? String(row[devCol] || "").trim() : "";
      const rawDate = dateCol ? row[dateCol] : "";
      const rawDue = dueCol ? row[dueCol] : "";

      tasksToCreate.push({
        title,
        status: statusMap[rawStatus] || (validStatuses.includes(row[statusCol!]) ? row[statusCol!] : "Pending"),
        priority: priorityMap[rawPriority] || (validPriorities.includes(row[priorityCol!]) ? row[priorityCol!] : "Medium"),
        assignee: resolveDeveloper(rawDev) || null,
        date: parseDate(rawDate) || new Date(),
        dueDate: parseDate(rawDue) || null,
      });
    }

    if (tasksToCreate.length === 0) {
      return NextResponse.json(
        { error: "No valid tasks found in file", errors },
        { status: 400 }
      );
    }

    const created = await Task.insertMany(tasksToCreate);

    return NextResponse.json({
      message: `${created.length} tasks imported successfully`,
      imported: created.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to import tasks" },
      { status: 500 }
    );
  }
}
