import { Request, Response } from "express";
import Issue from "../models/Issue";
import Vote from "../models/Vote";

// @desc    Create a new issue
// @route   POST /api/issues
// @access  Private
export const createIssue = async (req: any, res: Response) => {
  try {
    const { title, description, category, latitude, longitude } = req.body;

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
      user_id: req.user._id,
    });

    console.log("Issue created successfully:", issue._id);
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
    const { category, status, sort, user_id } = req.query;
    let query: any = {};

    if (category && category !== "all") query.category = category;
    if (status && status !== "all") query.status = status;
    if (user_id && user_id !== "all") query.user_id = user_id;

    let issuesQuery = Issue.find(query).populate("user_id", "name");

    if (sort === "priority") {
      // Priority Algorithm: 
      // 1. Resolved issues have lowest priority
      // 2. Pending issues have higher priority than In Progress
      // 3. More votes = higher priority
      // 4. Recency (newer = higher priority)
      
      // We can use a weighted sort or multiple sort criteria
      issuesQuery = issuesQuery.sort({
        status: 1, // pending (p) < in-progress (i) < resolved (r) - alphabetical sort might not work as intended
        votes: -1,
        createdAt: -1
      });
      
      // Better approach for status priority:
      const issues = await Issue.find(query).populate("user_id", "name");
      const statusWeight = { "pending": 3, "in-progress": 2, "resolved": 1 };
      
      issues.sort((a: any, b: any) => {
        const weightA = statusWeight[a.status as keyof typeof statusWeight] || 0;
        const weightB = statusWeight[b.status as keyof typeof statusWeight] || 0;
        
        if (weightA !== weightB) return weightB - weightA;
        if (a.votes !== b.votes) return b.votes - a.votes;
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

    issue.status = status;
    await issue.save();

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

    res.json({
      totalIssues,
      resolvedIssues,
      pendingIssues,
      inProgressIssues,
      rejectedIssues,
      categoryStats,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
