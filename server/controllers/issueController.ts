import { Request, Response } from "express";
import Issue from "../models/Issue";
import Vote from "../models/Vote";
import User from "../models/User";
import Notification from "../models/Notification";
import { getIO } from "../socket";

// Helper to calculate distance in km
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180);
};

// @desc    Create a new issue
// @route   POST /api/issues
// @access  Private
export const createIssue = async (req: any, res: Response) => {
  try {
    const { 
      title, 
      description, 
      category, 
      latitude, 
      longitude, 
      user_address, 
      issue_location, 
      pin_code,
      severity,
      urgency,
      keywords
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image" });
    }

    const issue = await Issue.create({
      title,
      description,
      category,
      image_url: req.file.path,
      latitude: Number(latitude),
      longitude: Number(longitude),
      user_address,
      issue_location,
      pin_code,
      user_id: req.user._id,
      severity: severity || "medium",
      urgency: urgency || "medium",
      keywords: keywords ? (typeof keywords === 'string' ? JSON.parse(keywords) : keywords) : [],
    });

    console.log("Issue created successfully:", issue._id);

    // Notify nearby users (within 5km)
    const users = await User.find({ _id: { $ne: req.user._id } });
    const io = getIO();

    // Emit general event for real-time updates (e.g., live map)
    io.emit("issue:created", issue);

    for (const user of users) {
      if (user.latitude && user.longitude) {
        const distance = getDistance(latitude, longitude, user.latitude, user.longitude);
        if (distance <= 5) {
          const notification = await Notification.create({
            user_id: user._id,
            title: "New Issue Nearby",
            message: `A new ${category} issue has been reported near your location: ${title}`,
            type: "nearby_issue",
            issue_id: issue._id,
          });
          io.to(user._id.toString()).emit("notification", notification);
        }
      }
    }

    res.status(201).json(issue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all issues
// @route   GET /api/issues
// @access  Public
export const getIssues = async (req: Request, res: Response) => {
  try {
    const { category, status, sort, user_id, startDate, endDate } = req.query;
    let query: any = {};

    if (category && category !== "all") query.category = category;
    if (status && status !== "all") {
      if (typeof status === 'string' && status.includes(',')) {
        query.status = { $in: status.split(',') };
      } else {
        query.status = status;
      }
    }
    if (user_id && user_id !== "all") query.user_id = user_id;

    // Date range filtering
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    let issuesQuery = Issue.find(query).populate("user_id", "name");

    if (sort === "priority") {
      // Enhanced Priority Algorithm:
      // 1. Severity (critical/high > medium > low)
      // 2. Urgency (critical/high > medium > low)
      // 3. Status (pending > in-progress > resolved)
      // 4. Votes (more = higher)
      // 5. Recency (newer = higher)
      
      const issues = await Issue.find(query).populate("user_id", "name");
      
      const statusWeight = { "pending": 3, "in-progress": 2, "resolved": 1 };
      const severityWeight = { "critical": 4, "high": 3, "medium": 2, "low": 1 };
      const urgencyWeight = { "critical": 4, "high": 3, "medium": 2, "low": 1 };
      
      issues.sort((a: any, b: any) => {
        // 1. Severity
        const sevA = severityWeight[a.severity as keyof typeof severityWeight] || 2;
        const sevB = severityWeight[b.severity as keyof typeof severityWeight] || 2;
        if (sevA !== sevB) return sevB - sevA;

        // 2. Urgency
        const urgA = urgencyWeight[a.urgency as keyof typeof urgencyWeight] || 2;
        const urgB = urgencyWeight[b.urgency as keyof typeof urgencyWeight] || 2;
        if (urgA !== urgB) return urgB - urgA;

        // 3. Status
        const weightA = statusWeight[a.status as keyof typeof statusWeight] || 0;
        const weightB = statusWeight[b.status as keyof typeof statusWeight] || 0;
        if (weightA !== weightB) return weightB - weightA;
        
        // 4. Votes
        if (a.votes !== b.votes) return b.votes - a.votes;

        // 5. Recency
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      return res.json(issues);
    } else {
      issuesQuery = issuesQuery.sort(sort === "votes" ? "-votes" : "-createdAt");
    }

    const issues = await issuesQuery;
    console.log(`Found ${issues.length} issues for query:`, JSON.stringify(query));
    res.json(issues);
  } catch (error) {
    console.error("Get Issues Error:", error);
    res.status(500).json({ 
      message: "Server error fetching issues",
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// @desc    Get single issue
// @route   GET /api/issues/:id
// @access  Public
export const getIssueById = async (req: Request, res: Response) => {
  try {
    const issue = await Issue.findById(req.params.id).populate("user_id", "name");

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    res.json(issue);
  } catch (error) {
    console.error("Get Issue By ID Error:", error);
    res.status(500).json({ 
      message: "Server error fetching issue details",
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// @desc    Update issue status
// @route   PUT /api/issues/:id/status
// @access  Private/Admin
export const updateIssueStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const oldStatus = issue.status;
    issue.status = status;
    await issue.save();

    const io = getIO();
    // Emit general event for real-time updates
    io.emit("issue:updated", issue);

    // Notify the reporter
    if (oldStatus !== status) {
      const reporterNotification = await Notification.create({
        user_id: issue.user_id,
        title: status === "resolved" ? "Issue Resolved" : "Issue Status Updated",
        message: status === "resolved" 
          ? `Great news! Your issue "${issue.title}" has been resolved.`
          : `The status of your issue "${issue.title}" has been updated to ${status}.`,
        type: status === "resolved" ? "resolved" : "status_change",
        issue_id: issue._id,
      });
      io.to(issue.user_id.toString()).emit("notification", reporterNotification);

      // Notify voters if resolved
      if (status === "resolved") {
        const votes = await Vote.find({ issue_id: issue._id });
        for (const vote of votes) {
          if (vote.user_id.toString() !== issue.user_id.toString()) {
            const voterNotification = await Notification.create({
              user_id: vote.user_id,
              title: "Issue Resolved",
              message: `An issue you voted for, "${issue.title}", has been resolved!`,
              type: "resolved",
              issue_id: issue._id,
            });
            io.to(vote.user_id.toString()).emit("notification", voterNotification);
          }
        }
      }
    }

    res.json(issue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete issue
// @route   DELETE /api/issues/:id
// @access  Private/Admin
export const deleteIssue = async (req: Request, res: Response) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    await issue.deleteOne();

    // Emit general event for real-time updates
    const io = getIO();
    io.emit("issue:deleted", req.params.id);

    res.json({ message: "Issue removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Vote for an issue
// @route   POST /api/issues/:id/vote
// @access  Private
export const voteIssue = async (req: any, res: Response) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const alreadyVoted = await Vote.findOne({
      issue_id: req.params.id,
      user_id: req.user._id,
    });

    if (alreadyVoted) {
      return res.status(400).json({ message: "You have already voted for this issue" });
    }

    await Vote.create({
      issue_id: req.params.id,
      user_id: req.user._id,
    });

    issue.votes += 1;
    await issue.save();

    // Emit general event for real-time updates
    const io = getIO();
    io.emit("issue:updated", issue);

    res.json({ message: "Vote added", votes: issue.votes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get analytics
// @route   GET /api/issues/analytics
// @access  Private/Admin
export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const totalIssues = await Issue.countDocuments();
    const resolvedIssues = await Issue.countDocuments({ status: "resolved" });
    const pendingIssues = await Issue.countDocuments({ status: "pending" });
    const inProgressIssues = await Issue.countDocuments({ status: "in-progress" });
    const rejectedIssues = await Issue.countDocuments({ status: "rejected" });

    const categoryStats = await Issue.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const severityStats = await Issue.aggregate([
      { $group: { _id: "$severity", count: { $sum: 1 } } },
    ]);

    const urgencyStats = await Issue.aggregate([
      { $group: { _id: "$urgency", count: { $sum: 1 } } },
    ]);

    res.json({
      totalIssues,
      resolvedIssues,
      pendingIssues,
      inProgressIssues,
      rejectedIssues,
      categoryStats,
      severityStats,
      urgencyStats,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
