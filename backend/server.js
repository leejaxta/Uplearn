const express = require("express");
const jsonServer = require("json-server");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();

server.use(middlewares);

server.use("/uploads", express.static(path.join(__dirname, "uploads")));

if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

const uploadDirs = ["./uploads/images", "./uploads/videos", "./uploads/docs"];
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "./uploads/";

    if (file.mimetype.startsWith("image/")) {
      uploadPath += "images/";
    } else if (file.mimetype.startsWith("video/")) {
      uploadPath += "videos/";
    } else {
      uploadPath += "docs/";
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/avif",

    "video/mp4",
    "video/avi",
    "video/mov",
    "video/wmv",
    "video/flv",
    "video/webm",

    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 20,
  },
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "File too large. Maximum size is 100MB." });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res
        .status(400)
        .json({ message: "Too many files. Maximum is 20 files per request." });
    }
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

server.put(
  "/courses/:id",
  upload.array("files"),
  handleMulterError,
  (req, res) => {
    const db = router.db;
    const courseId = parseInt(req.params.id);

    try {
      const existingCourse = db.get("courses").find({ id: courseId }).value();
      if (!existingCourse) {
        return res.status(404).json({ message: "Course not found" });
      }

      let courseData;
      try {
        courseData = JSON.parse(req.body.data);
      } catch (parseError) {
        throw new Error("Invalid JSON data in request");
      }

      const {
        title,
        description,
        price,
        instructorId,
        instructorName,
        topics,
        finalQuiz,
      } = courseData;

      if (
        !title ||
        !description ||
        price === undefined ||
        !instructorId ||
        !instructorName
      ) {
        throw new Error(
          "Missing required course fields: title, description, price, instructorId, instructorName"
        );
      }

      if (!topics || topics.length === 0) {
        throw new Error("Course must have at least one topic");
      }

      const topicFilesMap = topics.map(() => ({ docs: [], video: null }));

      const fileTypes = Array.isArray(req.body.fileTypes)
        ? req.body.fileTypes
        : req.body.fileTypes
        ? [req.body.fileTypes]
        : [];

      const topicIndices = Array.isArray(req.body.topicIndices)
        ? req.body.topicIndices
        : req.body.topicIndices
        ? [req.body.topicIndices]
        : [];

      let courseImage = existingCourse.image;

      if (req.files && req.files.length > 0) {
        if (
          fileTypes.length !== req.files.length ||
          topicIndices.length !== req.files.length
        ) {
          throw new Error(
            `Metadata mismatch: ${req.files.length} files, ${fileTypes.length} types, ${topicIndices.length} indices`
          );
        }
      }

      req.files?.forEach((file, index) => {
        const fileType = fileTypes[index];
        const topicIndex = topicIndices[index];

        let filePath;
        if (file.mimetype.startsWith("image/")) {
          filePath = 'https://uplearn-backend-e08l.onrender.com/uploads/images/${file.filename}`;
        } else if (file.mimetype.startsWith("video/")) {
          filePath = `https://uplearn-backend-e08l.onrender.com/uploads/videos/${file.filename}`;
        } else {
          filePath = `https://uplearn-backend-e08l.onrender.com/uploads/docs/${file.filename}`;
        }

        const fileData = {
          name: file.originalname,
          path: filePath,
          type: file.mimetype,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        };

        if (fileType === "image" && topicIndex === "-1") {
          if (existingCourse.image) {
            const oldImagePath = existingCourse.image
              .replace("https://uplearn-backend-e08l.onrender.com", ".")
              .replace("/uploads", "./uploads");
            fs.unlink(oldImagePath, (err) => {
              if (err) console.warn("Could not delete old course image:", err);
            });
          }
          courseImage = fileData.path;
        } else if (fileType === "video" || fileType === "doc") {
          const tIndex = parseInt(topicIndex);

          if (isNaN(tIndex) || tIndex < 0 || tIndex >= topics.length) {
            throw new Error(
              `Invalid topicIndex ${topicIndex} for file ${
                file.originalname
              }. Must be 0-${topics.length - 1}`
            );
          }

          if (fileType === "video") {
            if (topicFilesMap[tIndex].video) {
              throw new Error(
                `Topic "${topics[tIndex].title}" already has a video in this update`
              );
            }
            topicFilesMap[tIndex].video = fileData;
          } else if (fileType === "doc") {
            topicFilesMap[tIndex].docs.push(fileData);
          }
        } else {
          console.warn(
            `Unhandled file type/index combination: ${fileType}/${topicIndex}`
          );
        }
      });

      const existingTopics = db.get("topics").filter({ courseId }).value();
      const updatedTopicIds = [];

      const enrichedTopics = topics.map((topic, idx) => {
        if (!topic.title || !topic.description) {
          throw new Error(`Topic ${idx + 1} missing title or description`);
        }

        const filesForTopic = topicFilesMap[idx];
        if (
          !filesForTopic.docs ||
          (filesForTopic.docs.length === 0 &&
            existingTopics[idx] &&
            existingTopics[idx].files &&
            Array.isArray(existingTopics[idx].files))
        ) {
          const newDocsForTopic = req.files?.filter(
            (file, index) =>
              fileTypes[index] === "doc" &&
              topicIndices[index] === idx.toString()
          );

          if (!newDocsForTopic || newDocsForTopic.length === 0) {
            filesForTopic.docs = existingTopics[idx].files.map((file) => ({
              name: file.name || "Unknown Document",
              path: file.path,
              type: file.type || "application/octet-stream",
              size: file.size || 0,
              uploadedAt: file.uploadedAt || new Date().toISOString(),
            }));
          }
        }

        if (!filesForTopic.video && existingTopics[idx]) {
          filesForTopic.video = { path: existingTopics[idx].video };
        }

        if (!filesForTopic.video) {
          throw new Error(
            `Topic "${topic.title}" must include exactly 1 video`
          );
        }

        if (!topic.quiz) {
          throw new Error(`Topic "${topic.title}" must include a quiz`);
        }

        if (!topic.quiz.questions || topic.quiz.questions.length === 0) {
          throw new Error(
            `Topic "${topic.title}" quiz must have at least one question`
          );
        }

        topic.quiz.questions.forEach((question, qIdx) => {
          if (!question.q || !question.answer) {
            throw new Error(
              `Topic "${topic.title}" question ${
                qIdx + 1
              } missing question text or answer`
            );
          }
          if (!question.options || question.options.length < 2) {
            throw new Error(
              `Topic "${topic.title}" question ${
                qIdx + 1
              } must have at least 2 options`
            );
          }
        });

        const topicId = existingTopics[idx]?.id || courseId + idx + 1;

        updatedTopicIds.push(topicId);

        if (existingTopics[idx]) {
          if (
            existingTopics[idx].video &&
            filesForTopic.video?.path !== existingTopics[idx].video
          ) {
            const oldVideoPath = existingTopics[idx].video
              .replace("https://uplearn-backend-e08l.onrender.com", ".")
              .replace("/uploads", "./uploads");
            fs.unlink(oldVideoPath, (err) => {
              if (err) console.warn("Could not delete old video:", err);
            });
          }

          if (
            existingTopics[idx].files &&
            Array.isArray(existingTopics[idx].files)
          ) {
            existingTopics[idx].files.forEach((file) => {
              if (file.path) {
                const oldDocPath = file.path
                  .replace("https://uplearn-backend-e08l.onrender.com", ".")
                  .replace("/uploads", "./uploads");
                const isNewDoc = filesForTopic.docs.some(
                  (newDoc) => newDoc.path === file.path
                );
                if (!isNewDoc) {
                  fs.unlink(oldDocPath, (err) => {
                    if (err) console.warn("Could not delete old doc:", err);
                  });
                }
              }
            });
          }
        }

        return {
          id: topicId,
          courseId,
          title: topic.title,
          description: topic.description,
          files: filesForTopic.docs,
          video: filesForTopic.video.path,
          quiz: {
            pass: topic.quiz.pass || false,
            questions: topic.quiz.questions,
          },
          createdAt: existingTopics[idx]?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      if (finalQuiz && finalQuiz.questions && finalQuiz.questions.length > 0) {
        finalQuiz.questions.forEach((question, qIdx) => {
          if (!question.q || !question.answer) {
            throw new Error(
              `Final quiz question ${qIdx + 1} missing question text or answer`
            );
          }
          if (!question.options || question.options.length < 2) {
            throw new Error(
              `Final quiz question ${qIdx + 1} must have at least 2 options`
            );
          }
        });
      }

      const updatedCourseRecord = {
        ...existingCourse,
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        instructorId,
        instructorName: instructorName.trim(),
        image: courseImage,
        topics: enrichedTopics.map((t) => t.id),
        finalQuiz: finalQuiz || existingCourse.finalQuiz,
        updatedAt: new Date().toISOString(),
      };

      db.get("topics")
        .remove(
          (topic) =>
            topic.courseId === courseId && !updatedTopicIds.includes(topic.id)
        )
        .write();

      enrichedTopics.forEach((topic) => {
        const existingTopic = db.get("topics").find({ id: topic.id }).value();
        if (existingTopic) {
          db.get("topics").find({ id: topic.id }).assign(topic).write();
        } else {
          db.get("topics").push(topic).write();
        }
      });

      db.get("courses")
        .find({ id: courseId })
        .assign(updatedCourseRecord)
        .write();

      res.json({
        success: true,
        message: "Course updated successfully",
        data: {
          course: updatedCourseRecord,
          topics: enrichedTopics,
        },
      });
    } catch (err) {
      console.error("Error updating course:", err);

      if (req.files) {
        req.files.forEach((file) => {
          fs.unlink(file.path, (unlinkErr) => {
            if (unlinkErr) console.error("Error deleting file:", unlinkErr);
          });
        });
      }

      res.status(400).json({
        success: false,
        message: err.message || "Failed to update course",
        error: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
    }
  }
);

server.post(
  "/courses",
  upload.array("files"),
  handleMulterError,
  (req, res) => {
    const db = router.db;

    try {
      let courseData;
      try {
        courseData = JSON.parse(req.body.data);
      } catch (parseError) {
        throw new Error("Invalid JSON data in request");
      }

      const {
        title,
        description,
        price,
        instructorId,
        instructorName,
        topics,
        finalQuiz,
      } = courseData;

      if (
        !title ||
        !description ||
        price === undefined ||
        !instructorId ||
        !instructorName
      ) {
        throw new Error(
          "Missing required course fields: title, description, price, instructorId, instructorName"
        );
      }

      if (!topics || topics.length === 0) {
        throw new Error("Course must have at least one topic");
      }

      const courseId = Date.now();

      const topicFilesMap = topics.map(() => ({ docs: [], video: null }));

      const fileTypes = Array.isArray(req.body.fileTypes)
        ? req.body.fileTypes
        : req.body.fileTypes
        ? [req.body.fileTypes]
        : [];

      const topicIndices = Array.isArray(req.body.topicIndices)
        ? req.body.topicIndices
        : req.body.topicIndices
        ? [req.body.topicIndices]
        : [];

      let courseImage = null;

      if (req.files && req.files.length > 0) {
        if (
          fileTypes.length !== req.files.length ||
          topicIndices.length !== req.files.length
        ) {
          throw new Error(
            `Metadata mismatch: ${req.files.length} files, ${fileTypes.length} types, ${topicIndices.length} indices`
          );
        }
      }

      req.files?.forEach((file, index) => {
        const fileType = fileTypes[index];
        const topicIndex = topicIndices[index];

        let filePath;
        if (file.mimetype.startsWith("image/")) {
          filePath = `https://uplearn-backend-e08l.onrender.com/uploads/images/${file.filename}`;
        } else if (file.mimetype.startsWith("video/")) {
          filePath = `https://uplearn-backend-e08l.onrender.com/uploads/videos/${file.filename}`;
        } else {
          filePath = `https://uplearn-backend-e08l.onrender.com/uploads/docs/${file.filename}`;
        }

        const fileData = {
          name: file.originalname,
          path: filePath,
          type: file.mimetype,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        };

        if (fileType === "image" && topicIndex === "-1") {
          courseImage = fileData.path;
        } else if (fileType === "video" || fileType === "doc") {
          const tIndex = parseInt(topicIndex);

          if (isNaN(tIndex) || tIndex < 0 || tIndex >= topics.length) {
            throw new Error(
              `Invalid topicIndex ${topicIndex} for file ${
                file.originalname
              }. Must be 0-${topics.length - 1}`
            );
          }

          if (fileType === "video") {
            if (topicFilesMap[tIndex].video) {
              throw new Error(
                `Topic "${topics[tIndex].title}" already has a video`
              );
            }
            topicFilesMap[tIndex].video = fileData;
          } else if (fileType === "doc") {
            topicFilesMap[tIndex].docs.push(fileData);
          }
        } else {
          console.warn(
            `Unhandled file type/index combination: ${fileType}/${topicIndex}`
          );
        }
      });

      const enrichedTopics = topics.map((topic, idx) => {
        if (!topic.title || !topic.description) {
          throw new Error(`Topic ${idx + 1} missing title or description`);
        }

        const filesForTopic = topicFilesMap[idx];

        if (!filesForTopic.video) {
          throw new Error(
            `Topic "${topic.title}" must include exactly 1 video`
          );
        }

        if (!topic.quiz) {
          throw new Error(`Topic "${topic.title}" must include a quiz`);
        }

        if (!topic.quiz.questions || topic.quiz.questions.length === 0) {
          throw new Error(
            `Topic "${topic.title}" quiz must have at least one question`
          );
        }
        topic.quiz.questions.forEach((question, qIdx) => {
          if (!question.q || !question.answer) {
            throw new Error(
              `Topic "${topic.title}" question ${
                qIdx + 1
              } missing question text or answer`
            );
          }
          if (!question.options || question.options.length < 2) {
            throw new Error(
              `Topic "${topic.title}" question ${
                qIdx + 1
              } must have at least 2 options`
            );
          }
        });

        const topicId = courseId + idx + 1;

        return {
          id: topicId,
          courseId,
          title: topic.title,
          description: topic.description,
          files: filesForTopic.docs,
          video: filesForTopic.video.path,
          quiz: {
            pass: topic.quiz.pass || false,
            questions: topic.quiz.questions,
          },
          createdAt: new Date().toISOString(),
        };
      });

      if (finalQuiz && finalQuiz.questions && finalQuiz.questions.length > 0) {
        finalQuiz.questions.forEach((question, qIdx) => {
          if (!question.q || !question.answer) {
            throw new Error(
              `Final quiz question ${qIdx + 1} missing question text or answer`
            );
          }
          if (!question.options || question.options.length < 2) {
            throw new Error(
              `Final quiz question ${qIdx + 1} must have at least 2 options`
            );
          }
        });
      }

      const courseRecord = {
        id: courseId,
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        instructorId,
        instructorName: instructorName.trim(),
        image: courseImage,
        topics: enrichedTopics.map((t) => t.id),
        finalQuiz: finalQuiz || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "active",
      };

      db.get("courses").push(courseRecord).write();
      db.get("topics")
        .push(...enrichedTopics)
        .write();

      res.status(201).json({
        success: true,
        message: "Course created successfully",
        data: {
          course: courseRecord,
          topics: enrichedTopics,
        },
      });
    } catch (err) {
      console.error("Error creating course:", err);

      if (req.files) {
        req.files.forEach((file) => {
          fs.unlink(file.path, (unlinkErr) => {
            if (unlinkErr) console.error("Error deleting file:", unlinkErr);
          });
        });
      }

      res.status(400).json({
        success: false,
        message: err.message || "Failed to create course",
        error: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
    }
  }
);

server.delete("/courses/:id", (req, res) => {
  const db = router.db;
  const courseId = parseInt(req.params.id);

  const course = db.get("courses").find({ id: courseId }).value();
  if (!course) {
    return res.status(404).json({ message: "Course not found" });
  }

  try {
    const topics = db.get("topics").filter({ courseId }).value();
    db.get("topics").remove({ courseId }).write();

    db.get("courses").remove({ id: courseId }).write();

    const filesToDelete = [];

    if (course.image) {
      const imagePath = course.image
        .replace("https://uplearn-backend-e08l.onrender.com", ".")
        .replace("/uploads", "./uploads");
      filesToDelete.push(imagePath);
    }

    topics.forEach((topic) => {
      if (topic.video) {
        const videoPath = topic.video
          .replace("https://uplearn-backend-e08l.onrender.com", ".")
          .replace("/uploads", "./uploads");
        filesToDelete.push(videoPath);
      }

      if (topic.files && Array.isArray(topic.files)) {
        topic.files.forEach((file) => {
          if (file.path) {
            const filePath = file.path
              .replace("https://uplearn-backend-e08l.onrender.com", ".")
              .replace("/uploads", "./uploads");
            filesToDelete.push(filePath);
          }
        });
      }
    });

    filesToDelete.forEach((filePath) => {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.warn(`Could not delete file: ${filePath}`, err);
        }
      });
    });

    res.json({
      success: true,
      message: "Course and associated files deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting course:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete course",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

server.get("/courses/instructor/:id", (req, res) => {
  const db = router.db;
  const instructorId = req.params.id;

  if (!instructorId) {
    return res.status(400).json({ message: "instructorId is required" });
  }

  const courses = db
    .get("courses")
    .filter({ instructorId: String(instructorId) })
    .value();

  const enriched = courses.map((course) => {
    const topics = db.get("topics").filter({ courseId: course.id }).value();
    return { ...course, topics };
  });

  res.json(enriched);
});

server.get("/students/courses/:id", (req, res) => {
  const db = router.db;
  const studentId = req.params.id;

  if (!studentId) {
    return res.status(400).json({ message: "studentId is required" });
  }

  try {
    const enrollments = db
      .get("enrollments")
      .filter({ student_id: String(studentId) })
      .value();

    const courses = enrollments
      .map((enrollment) => {
        const course = db
          .get("courses")
          .find({ id: enrollment.course_id })
          .value();

        if (!course) return null;

        const topics = db.get("topics").filter({ courseId: course.id }).value();

        return {
          ...course,
          topics,
          enrollmentStatus: enrollment.status,
          enrolledAt: enrollment.createdAt,
        };
      })
      .filter(Boolean);

    res.json(courses);
  } catch (error) {
    console.error("Error fetching student courses:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

server.get("/students/courses/progress/:id", (req, res) => {
  const db = router.db;
  const studentId = req.params.id;

  if (!studentId) {
    return res.status(400).json({ message: "studentId is required" });
  }

  try {
    const enrollments = db
      .get("enrollments")
      .filter({ student_id: String(studentId) })
      .value();

    const progressData = enrollments.map((enrollment) => {
      const course = db
        .get("courses")
        .find({ id: enrollment.course_id })
        .value();

      if (!course) {
        return {
          enrollmentId: enrollment.id,
          courseId: enrollment.course_id,
          courseTitle: null,
          courseImage: null,
          courseDescription: null,
          totalQuizzes: 0,
          completedCount: 0,
          progressPercentage: 0,
          status: enrollment.status,
          enrolledAt: enrollment.enrolled_at,
        };
      }

      const topics = db.get("topics").filter({ courseId: course.id }).value();
      const totalQuizzes = topics.length + (course.finalQuiz ? 1 : 0);

      const completedTopics = db
        .get("enrollment_topic_progress")
        .filter({ enrollment_id: enrollment.id })
        .value();

      const completedFinal = db
        .get("enrollment_final_quiz")
        .find({ enrollment_id: enrollment.id })
        .value();

      const completedCount = completedTopics.length + (completedFinal ? 1 : 0);

      return {
        enrollmentId: enrollment.id,
        courseId: course.id,
        courseTitle: course.title,
        courseImage: course.image || null,
        courseDescription: course.description || null,
        totalQuizzes,
        completedCount,
        progressPercentage:
          totalQuizzes > 0
            ? Math.round((completedCount / totalQuizzes) * 100)
            : 0,
        status: enrollment.status,
        enrolledAt: enrollment.enrolled_at,
      };
    });

    res.json(progressData);
  } catch (error) {
    console.error("Error fetching course progress:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

function getLast4Weeks() {
  const weeks = [];
  const now = new Date();
  for (let i = 3; i >= 0; i--) {
    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    weeks.push({
      start,
      end,
      label: `${start.toISOString().slice(0, 10)} to ${end
        .toISOString()
        .slice(0, 10)}`,
    });
  }
  return weeks;
}

function groupEnrollmentsByWeek(enrollments, weeks) {
  return weeks.map((w) => {
    const count = enrollments.filter((e) => {
      const d = new Date(e.enrolled_at);
      return d >= w.start && d <= w.end;
    }).length;
    return { week: w.label, count };
  });
}

server.get("/instructors/analytics/:instructorId", (req, res) => {
  const db = router.db;
  const { instructorId } = req.params;

  const courses = db.get("courses").filter({ instructorId }).value();

  const enrollments = db.get("enrollments").value();
  const instructorCourseIds = courses.map((c) => c.id);

  const instructorEnrollments = enrollments.filter((e) =>
    instructorCourseIds.includes(e.course_id)
  );

  const payments = db.get("payments").filter({ status: "completed" }).value();

  const weeks = getLast4Weeks();

  let totalEnrollments = 0;
  let totalRevenue = 0;

  const courseStats = courses.map((course) => {
    const courseEnrollments = instructorEnrollments.filter(
      (e) => e.course_id === course.id
    );
    totalEnrollments += courseEnrollments.length;

    let revenue = 0;
    if (course.price > 0) {
      const paidEnrollments = payments.filter((p) => p.course_id === course.id);
      revenue = paidEnrollments.length * course.price;
      totalRevenue += revenue;
    }

    const weeklyEnrollments = groupEnrollmentsByWeek(courseEnrollments, weeks);

    return {
      courseId: course.courseId,
      title: course.title,
      price: course.price,
      totalEnrollments: courseEnrollments.length,
      revenue,
      weeklyEnrollments,
      status: courseEnrollments.length > 0 ? "active" : "inactive",
    };
  });

  res.json({
    instructorId,
    totalCourses: courses.length,
    totalEnrollments,
    weeklyEnrollments: groupEnrollmentsByWeek(instructorEnrollments, weeks),
    totalRevenue,
    courses: courseStats,
  });
});

server.get("/courses/analytics/:courseId", (req, res) => {
  const db = router.db;
  const { courseId } = req.params;
  const cid = parseInt(courseId);

  const course = db.get("courses").find({ id: cid }).value();
  if (!course) return res.status(404).json({ error: "Course not found" });

  const enrollments = db.get("enrollments").filter({ course_id: cid }).value();

  const payments = db
    .get("payments")
    .filter({ course_id: cid, status: "completed" })
    .value();

  const weeks = getLast4Weeks();

  let revenue = 0;
  if (course.price > 0) {
    revenue = payments.length * course.price;
  }

  res.json({
    courseId: course.courseId,
    title: course.title,
    price: course.price,
    totalEnrollments: enrollments.length,
    weeklyEnrollments: groupEnrollmentsByWeek(enrollments, weeks),
    revenue,
    status: "active",
  });
});

server.use(router);

server.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(
    ` JSON Server with file upload is running on http://localhost:${PORT}`
  );
});
