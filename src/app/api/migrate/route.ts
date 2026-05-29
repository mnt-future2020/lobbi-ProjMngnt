import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Project from "@/lib/models/Project";
import Task from "@/lib/models/Task";
import Developer from "@/lib/models/Developer";
import Folder from "@/lib/models/Folder";

export async function POST() {
  try {
    await connectDB();

    // ── 1. Ensure "Lobbi" project exists ──────────────────────────────────
    let lobbiProject = await Project.findOne({ name: "Lobbi" });

    if (!lobbiProject) {
      const developers = await Developer.find().select("_id").lean();
      lobbiProject = await Project.create({
        name: "Lobbi",
        description: "Default project - migrated from single-project setup",
        status: "active",
        members: developers.map((d) => d._id),
      });
    }

    // ── 2. Assign only un-projected tasks to "Lobbi" (never overwrite existing project) ──
    const lobbiId = new mongoose.Types.ObjectId(lobbiProject._id as string);
    const taskResult = await Task.updateMany(
      { $or: [{ project: { $exists: false } }, { project: null }] },
      { $set: { project: lobbiId } }
    );

    // ── 3. Create a "General" folder for each project ─────────────────────
    const projects = await Project.find().lean();
    const folderResults: { project: string; folder: string; tasksAssigned: number }[] = [];

    for (const proj of projects) {
      const projId = new mongoose.Types.ObjectId(proj._id as string);

      // Check if "General" folder already exists for this project
      let folder = await Folder.findOne({ project: projId, name: "General" });
      if (!folder) {
        folder = await Folder.create({ name: "General", project: projId, order: 0 });
      }

      const folderId = new mongoose.Types.ObjectId(folder._id as string);

      // Assign all tasks in this project that have no folder → General
      const res = await Task.updateMany(
        {
          project: projId,
          $or: [{ folder: { $exists: false } }, { folder: null }],
        },
        { $set: { folder: folderId } }
      );

      folderResults.push({
        project: proj.name,
        folder: folder.name,
        tasksAssigned: res.modifiedCount,
      });
    }

    return NextResponse.json({
      message: "Migration completed",
      lobbiProject: { id: lobbiProject._id, name: lobbiProject.name },
      tasksUpdated: taskResult.modifiedCount,
      folders: folderResults,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
  }
}
