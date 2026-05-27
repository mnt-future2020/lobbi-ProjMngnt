import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Project from "@/lib/models/Project";
import Task from "@/lib/models/Task";
import Developer from "@/lib/models/Developer";

export async function POST() {
  try {
    await connectDB();

    // Check if "Lobbi" project already exists
    let project = await Project.findOne({ name: "Lobbi" });

    if (!project) {
      // Get all developers to add as members
      const developers = await Developer.find().select("_id").lean();
      const memberIds = developers.map((d) => d._id);

      // Create the Lobbi project
      project = await Project.create({
        name: "Lobbi",
        description: "Default project - migrated from single-project setup",
        status: "active",
        members: memberIds,
      });
    }

    // Update all tasks - force reassign to ensure ObjectId type
    const projectObjectId = new mongoose.Types.ObjectId(project._id);
    const result = await Task.updateMany(
      {},
      { $set: { project: projectObjectId } }
    );

    return NextResponse.json({
      message: "Migration completed",
      projectId: project._id,
      projectName: project.name,
      tasksUpdated: result.modifiedCount,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: "Migration failed" },
      { status: 500 }
    );
  }
}
