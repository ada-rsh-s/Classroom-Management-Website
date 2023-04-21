var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
var ObjectId = require("mongodb").ObjectId;

module.exports = {
  tutorRegister: (tutor) => {
    return new Promise(async (resolve, reject) => {
      tutor.Password = await bcrypt.hash(tutor.Password, 10);
      db.main()
        .collection(collection.TUTOR_COLLECTION)
        .insertOne(tutor)
        .then((tutor) => {
          resolve(tutor);
        });
    });
  },
  tutorCheck: () => {
    return new Promise(async (resolve, reject) => {
      db.main()
        .collection(collection.TUTOR_COLLECTION)
        .findOne({ Status: "inserted" })
        .then((response) => {
          resolve(response);
        });
    });
  },
  doTutorLogin: (tutorData) => {
    let response = {};
    return new Promise(async (resolve, reject) => {
      let tutor = await db
        .main()
        .collection(collection.TUTOR_COLLECTION)
        .findOne({ Email: tutorData.Email });
      if (tutor) {
        bcrypt.compare(tutorData.Password, tutor.Password).then((status) => {
          if (status) {
            response.tutor = tutor;
            response.status = true;
            resolve(response);
          } else {
            resolve({ status: false });
          }
        });
      } else {
        resolve({ status: false });
      }
    });
  },
  addStudent: (student) => {
    return new Promise(async (resolve, reject) => {
      student.Rollno = parseInt(student.Rollno);
      student.Password = await bcrypt.hash(student.Password, 10);
      let rollno = await db
        .main()
        .collection(collection.STUDENT_COLLECTION)
        .findOne({ Rollno: student.Rollno });
      if (rollno) {
        resolve({ status: true });
      } else {
        db.main()
          .collection("student")
          .insertOne(student)
          .then((data) => {
            console.log(data);
            resolve(data.insertedId);
          });
      }
    });
  },
  singleattendance: (studId) => {
    return new Promise(async (resolve, reject) => {
      if (new Date().getDay() == 0) {
        attendObj = {
          date:
            ("0" + new Date().getDate()).slice(-2) +
            "-" +
            ("0" + (new Date().getMonth() + 1)).slice(-2) +
            "-" +
            new Date().getFullYear(),
          month:
            ("0" + (new Date().getMonth() + 1)).slice(-2) +
            "-" +
            new Date().getFullYear(),
          status: "Holiday",
        };
      } else {
        attendObj = {
          date:
            ("0" + new Date().getDate()).slice(-2) +
            "-" +
            ("0" + (new Date().getMonth() + 1)).slice(-2) +
            "-" +
            new Date().getFullYear(),
          month:
            ("0" + (new Date().getMonth() + 1)).slice(-2) +
            "-" +
            new Date().getFullYear(),
          status: "Absent",
          percentage: 0,
        };
      }
      let attendDetailObj = {
        student: ObjectId(studId),
        attendance: [attendObj],
      };
      let userexist = await db
        .main()
        .collection(collection.STUDENT_COLLECTION)
        .findOne({ _id: ObjectId(studId) });
      let studattend = await db
        .main()
        .collection(collection.ATTENDANCE_COLLECTION)
        .findOne({ student: ObjectId(studId) });
      if (userexist) {
        if (studattend) {
          let attendExist = studattend.attendance.findIndex(
            (attendanc) => attendanc.date == attendObj.date
          );
          if (attendExist == -1) {
            db.main()
              .collection(collection.ATTENDANCE_COLLECTION)
              .updateOne(
                { student: ObjectId(studId) },
                {
                  $push: { attendance: attendObj },
                }
              )
              .then((response) => {
                resolve();
              });
          }
        } else {
          db.main()
            .collection(collection.ATTENDANCE_COLLECTION)
            .insertOne(attendDetailObj)
            .then((response) => {
              resolve();
            });
        }
      }
      let holidays = await db
        .main()
        .collection(collection.HOLIDAY_COLLECTION)
        .find()
        .toArray();
      if (holidays) {
        for (var i = 0; i < holidays.length; i++) {
          let holidayObj = {
            date: holidays[i].Date,
            month: holidays[i].Date.substring(3, 10),
            status: "Holiday",
          };
          db.main()
            .collection(collection.ATTENDANCE_COLLECTION)
            .updateOne(
              { student: ObjectId(studId) },
              {
                $push: { attendance: holidayObj },
              }
            );
        }
      }
    });
  },
  getAllStudents: () => {
    return new Promise(async (resolve, reject) => {
      let students = await db
        .main()
        .collection(collection.STUDENT_COLLECTION)
        .find()
        .sort({ Rollno: 1 })
        .toArray();
      resolve(students);
    });
  },
  getStudentDetails: (studId) => {
    return new Promise((resolve, reject) => {
      db.main()
        .collection(collection.STUDENT_COLLECTION)
        .findOne({ _id: ObjectId(studId) })
        .then((student) => {
          resolve(student);
        });
    });
  },
  updateStudDetails: (studId, studDetails) => {
    return new Promise((resolve, reject) => {
      db.main()
        .collection(collection.STUDENT_COLLECTION)
        .updateOne(
          { _id: ObjectId(studId) },
          {
            $set: {
              Name: studDetails.Name,
              Gender: studDetails.Gender,
              Rollno: parseInt(studDetails.Rollno),
              Phone: studDetails.Phone,
              Email: studDetails.Email,
              Address: studDetails.Address,
              Username: studDetails.Username,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  deleteStudent: (studId) => {
    return new Promise((resolve, reject) => {
      db.main()
        .collection(collection.ATTENDANCE_COLLECTION)
        .deleteOne({ student: ObjectId(studId) });  
      db.main()
        .collection(collection.STUDENT_COLLECTION)
        .deleteOne({ _id: ObjectId(studId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  tutorProfile: (tutor, callback) => {
    db.main()
      .collection(collection.TUTOR_COLLECTION)
      .insertOne(tutor)
      .then((data) => {
        callback(data.insertedId);
      });
  },
  tutorProfileDetails: () => {
    return new Promise(async (resolve, reject) => {
      let teacher = await db
        .main()
        .collection(collection.TUTOR_COLLECTION)
        .findOne();
      resolve(teacher);
    });
  },
  updateTutDetails: (tutId, tutDetails) => {
    return new Promise((resolve, reject) => {
      db.main()
        .collection(collection.TUTOR_COLLECTION)
        .updateOne(
          { _id: ObjectId(tutId) },
          {
            $set: {
              Firstname: tutDetails.Firstname,
              Lastname: tutDetails.Lastname,
              Job: tutDetails.Job,
              Pin: tutDetails.Pin,
              Phone: tutDetails.Phone,
              Email: tutDetails.Email,
              Address: tutDetails.Address,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  docNotes: async (notes, callback) => {
    db.main()
      .collection(collection.NOTES_DOC_COLLECTION)
      .insertOne(notes)
      .then((data) => {
        callback(data.insertedId);
      });
  },
  vidNotes: async (notes, callback) => {
    db.main()
      .collection(collection.NOTES_VID_COLLECTION)
      .insertOne(notes)
      .then((data) => {
        callback(data.insertedId);
      });
  },
  uvidNotes: async (notes) => {
    return new Promise((resolve, reject) => {
      db.main()
        .collection(collection.NOTES_U_VID_COLLECTION)
        .insertOne(notes)
        .then((data) => {
          resolve(data.insertedId);
        });
    })
  },
  addAssign: (topic) => {
    let assignmentObj = {
      Topic: topic,
      assignments: [],
    };
    return new Promise((resolve, reject) => {
      db.main()
        .collection(collection.ASSIGNMENT_COLLECTION)
        .insertOne(assignmentObj)
        .then((response) => {
          resolve(response.insertedId);
        });
    });
  },
  viewAssign: () => {
    return new Promise(async (resolve, reject) => {
      let assign = await db
        .main()
        .collection(collection.ASSIGNMENT_COLLECTION)
        .find()
        .sort({ _id: -1 })
        .toArray();
      resolve(assign);
    });
  },
  deleteAssign: (assignId) => {
    return new Promise((resolve, reject) => {
      db.main()
        .collection(collection.ASSIGNMENT_COLLECTION)
        .deleteOne({ _id: ObjectId(assignId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  getAssignments: (studId) => {
    return new Promise(async (resolve, reject) => {
      let assignments = await db
        .main()
        .collection(collection.ASSIGNMENT_COLLECTION)
        .aggregate([
          {
            $match: { "assignments.student": ObjectId(studId) },
          },
          {
            $unwind: "$assignments",
          },
          {
            $project: {
              assignments: "$assignments",
              topic: "$Topic",
            },
          },
          {
            $match: { "assignments.student": ObjectId(studId) },
          },
        ])
        .toArray();
      resolve(assignments);
    });
  },
  manualAttend: (studId) => {
    let datecheck =
      ("0" + new Date().getDate()).slice(-2) +
      "-" +
      ("0" + (new Date().getMonth() + 1)).slice(-2) +
      "-" +
      new Date().getFullYear();
    return new Promise(async (resolve, reject) => {
      let studattend = await db
        .main()
        .collection(collection.ATTENDANCE_COLLECTION)
        .findOne({ student: ObjectId(studId) });
      if (studattend) {
        await db
          .main()
          .collection(collection.ATTENDANCE_COLLECTION)
          .updateOne(
            { student: ObjectId(studId), "attendance.date": datecheck },
            {
              $set: {
                "attendance.$.status": "Present",
                "attendance.$.percentage": 100,
              },
            }
          );
        resolve({ status: true });
      } else {
        let res =
          "Student was not logged in today. So attendance was not recorded";
        resolve(res);
      }
    });
  },
  getstudAttend: (studId) => {
    return new Promise(async (resolve, reject) => {
      let monthcheck =
        ("0" + (new Date().getMonth() + 1)).slice(-2) +
        "-" +
        new Date().getFullYear();
      let attend = await db
        .main()
        .collection(collection.ATTENDANCE_COLLECTION)
        .aggregate([
          {
            $match: { student: ObjectId(studId) },
          },
          {
            $unwind: "$attendance",
          },
          {
            $project: {
              attendate: "$attendance.date",
              month: "$attendance.month",
              status: "$attendance.status",
            },
          },
          {
            $match: { month: monthcheck },
          },
        ])
        .sort({ attendate: -1 })
        .toArray();
      resolve(attend);
    });
  },
  getAttendance: () => {
    return new Promise(async (resolve, reject) => {
      let datecheck =
        ("0" + new Date().getDate()).slice(-2) +
        "-" +
        ("0" + (new Date().getMonth() + 1)).slice(-2) +
        "-" +
        new Date().getFullYear();
      let attend = await db
        .main()
        .collection(collection.ATTENDANCE_COLLECTION)
        .aggregate([
          {
            $unwind: "$attendance",
          },
          {
            $project: {
              studId: "$student",
              attendate: "$attendance.date",
              status: "$attendance.status",
            },
          },
          {
            $match: { attendate: datecheck },
          },
          {
            $lookup: {
              from: collection.STUDENT_COLLECTION,
              localField: "studId",
              foreignField: "_id",
              as: "student",
            },
          },
        ])
        .toArray();
      resolve(attend);
    });
  },

  getAttendDate: (date) => {
    return new Promise(async (resolve, reject) => {
      let attend = await db
        .main()
        .collection(collection.ATTENDANCE_COLLECTION)
        .aggregate([
          {
            $unwind: "$attendance",
          },
          {
            $project: {
              studId: "$student",
              attendate: "$attendance.date",
              status: "$attendance.status",
            },
          },
          {
            $match: { attendate: date },
          },
          {
            $lookup: {
              from: collection.STUDENT_COLLECTION,
              localField: "studId",
              foreignField: "_id",
              as: "student",
            },
          },
        ])
        .toArray();
      resolve(attend);
    });
  },
  addAnnouncement: async (announce, callback) => {
    db.main()
      .collection(collection.ANNOUNCEMENT_COLLECTION)
      .insertOne(announce)
      .then((data) => {
        callback(data.insertedId);
      });
  },
  getAnnouncements: () => {
    return new Promise(async (resolve, reject) => {
      let announcement = await db
        .main()
        .collection(collection.ANNOUNCEMENT_COLLECTION)
        .find()
        .sort({ _id: -1 })
        .toArray();
      resolve(announcement);
    });
  },
  getEvents: () => {
    return new Promise(async (resolve, reject) => {
      let event = await db
        .main()
        .collection(collection.EVENT_COLLECTION)
        .find()
        .sort({ _id: -1 })
        .toArray();
      resolve(event);
    });
  },
  addEvent: async (event, callback) => {
    db.main()
      .collection(collection.EVENT_COLLECTION)
      .insertOne(event)
      .then((data) => {
        callback(data.insertedId);
      });
  },
  getEventDetails: (eventId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .main()
        .collection(collection.EVENT_COLLECTION)
        .findOne({ _id: ObjectId(eventId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  addPhotos: async (photo, callback) => {
    db.main()
      .collection(collection.PHOTO_COLLECTION)
      .insertOne(photo)
      .then((data) => {
        callback(data.insertedId);
      });
  },
  deletePhoto: (photoId) => {
    return new Promise((resolve, reject) => {
      db.main()
        .collection(collection.PHOTO_COLLECTION)
        .deleteOne({ _id: ObjectId(photoId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  deleteAnnounce: (announceId) => {
    return new Promise((resolve, reject) => {
      db.main()
        .collection(collection.ANNOUNCEMENT_COLLECTION)
        .deleteOne({ _id: ObjectId(announceId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  deleteEvent: (eventId) => {
    return new Promise((resolve, reject) => {
      db.main()
        .collection(collection.PAID_COLLECTION)
        .deleteOne({ event: ObjectId(eventId) });
      db.main()
        .collection(collection.EVENT_COLLECTION)
        .deleteOne({ _id: ObjectId(eventId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  deleteDoc: (docId) => {
    return new Promise((resolve, reject) => {
      db.main()
        .collection(collection.NOTES_DOC_COLLECTION)
        .deleteOne({ _id: ObjectId(docId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  deleteVid: (vidId) => {
    return new Promise((resolve, reject) => {
      db.main()
        .collection(collection.NOTES_VID_COLLECTION)
        .deleteOne({ _id: ObjectId(vidId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  deleteYou: (youId) => {
    return new Promise((resolve, reject) => {
      db.main()
        .collection(collection.NOTES_U_VID_COLLECTION)
        .deleteOne({ _id: ObjectId(youId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  getPaidStudents: (eventId) => {
    return new Promise(async (resolve, reject) => {
      let paid = await db
        .main()
        .collection(collection.PAID_COLLECTION)
        .aggregate([
          {
            $match: { event: ObjectId(eventId) },
          },
          {
            $lookup: {
              from: collection.STUDENT_COLLECTION,
              localField: "student",
              foreignField: "_id",
              as: "students",
            },
          },
          {
            $project: {
              students: "$students",
            },
          },
        ])
        .toArray();
      resolve(paid);
    });
  },
  addHoliday: (datecheck, insertdate) => {
    return new Promise(async (resolve, reject) => {
      db.main().collection(collection.HOLIDAY_COLLECTION).insertOne(insertdate);
      let attendObj = {
        date: datecheck,
        month: datecheck.substring(3, 10),
        status: "Holiday",
      };
      let userfind = await db
        .main()
        .collection(collection.STUDENT_COLLECTION)
        .aggregate([
          {
            $project: {
              _id: "$_id",
            },
          },
        ])
        .toArray();
      let dateexist = await db
        .main()
        .collection(collection.ATTENDANCE_COLLECTION)
        .findOne({ "attendance.date": datecheck });
      for (var i = 0; i < userfind.length; i++) {
        if (dateexist) {
          await db
            .main()
            .collection(collection.ATTENDANCE_COLLECTION)
            .updateOne(
              {
                student: ObjectId(userfind[i]._id),
                "attendance.date": datecheck,
              },
              {
                $set: {
                  "attendance.$.status": "Holiday",
                },
                $unset: { "attendance.$.percentage": { percentage: 0 } },
              }
            );
          resolve();
        } else {
          if (
            db
              .main()
              .collection(collection.ATTENDANCE_COLLECTION)
              .findOne({
                student: ObjectId(userfind[i]._id),
                "attendance.date": datecheck,
              })
          ) {
            db.main()
              .collection(collection.ATTENDANCE_COLLECTION)
              .updateOne(
                { student: ObjectId(userfind[i]._id) },
                {
                  $push: { attendance: attendObj },
                }
              )
              .then((response) => {
                resolve();
              });
          }
        }
      }
    });
  },
  subMarks: (mark, assignId, studId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .main()
        .collection(collection.ASSIGNMENT_COLLECTION)
        .updateOne(
          { _id: ObjectId(assignId), "assignments.student": ObjectId(studId) },
          { $set: { "assignments.$.mark": mark } }
        );
      resolve(mark);
    });
  },
  findPvtChat:(tutorId)=>{
    return new Promise((resolve,reject)=>{
      db.main().collection(collection.TUTOR_COLLECTION).findOne({_id:ObjectId(tutorId)}).then((response)=>{
        resolve(response)
      })
    })
  }
};
