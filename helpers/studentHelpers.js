const db = require("../config/connection");
const collection = require("../config/collections");
const { response } = require("express");
const bcrypt = require("bcrypt");
const ObjectId = require("mongodb").ObjectId;
const Razorpay = require("razorpay");
const { resolve } = require("path");
const instance = new Razorpay({
  key_id: "rzp_test_BTghMaFUWF72Za",
  key_secret: "GtVrMDo7vWDrDIWOZOc65ZFE",
});
module.exports = {
  doStudentLogin: (studentDetails) => {
    const response = {};
    return new Promise(async (resolve, reject) => {
      const student = await db
        .main()
        .collection(collection.STUDENT_COLLECTION)
        .findOne({ Username: studentDetails.Username });
      if (student) {
        bcrypt
          .compare(studentDetails.Password, student.Password)
          .then((status) => {
            if (status) {
              response.student = student;
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
  phoneNoCheck: (studentDetails) => {
    return new Promise(async (resolve, reject) => {
      const response = {};
      let status;
      const phone = await db
        .main()
        .collection(collection.STUDENT_COLLECTION)
        .findOne({ Phone: studentDetails.Phone });
      if (phone) {
        response.phone = phone;
        response.status = true;
        resolve(response);
      } else {
        status = false;
      }
      resolve(status);
    });
  },
  OtpCheck: (studentDetails) => {
    return new Promise(async (resolve, reject) => {
      resolve(studentDetails.otp);
    });
  },
  userTest: (studId) => {
    return new Promise(async (resolve, reject) => {
      const userexist = await db
        .main()
        .collection(collection.STUDENT_COLLECTION)
        .findOne({ _id: ObjectId(studId) });
      if (userexist) {
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    });
  },
  Notes: () => {
    return new Promise(async (resolve, reject) => {
      const doc = await db
        .main()
        .collection(collection.NOTES_DOC_COLLECTION)
        .find()
        .sort({ _id: -1 })
        .toArray();
      resolve(doc);
    });
  },
  videoNotes: () => {
    return new Promise(async (resolve, reject) => {
      const video = await db
        .main()
        .collection(collection.NOTES_VID_COLLECTION)
        .find()
        .sort({ _id: -1 })
        .toArray();
      resolve(video);
    });
  },
  utubeNotes: () => {
    return new Promise(async (resolve, reject) => {
      const uvideo = await db
        .main()
        .collection(collection.NOTES_U_VID_COLLECTION)
        .find()
        .sort({ _id: -1 })
        .toArray();
      resolve(uvideo);
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
  assignMarks: (studId) => {
    return new Promise(async (resolve, reject) => {
      let assign = await db
        .main()
        .collection(collection.ASSIGNMENT_COLLECTION)
        .aggregate([
          {
            $unwind: "$assignments",
          },
          {
            $project: {
              student: "$assignments.student",
              mark: "$assignments.mark",
              topic: "$Topic.Topic",
            },
          },
          {
            $match: { student: ObjectId(studId) },
          },
        ])
        .toArray();
      resolve(assign);
    });
  },
  subAssign: (assignId) => {
    return new Promise((resolve, reject) => {
      db.main()
        .collection(collection.ASSIGNMENT_COLLECTION)
        .findOne({ _id: ObjectId(assignId) });
      resolve(response);
    });
  },
  submitAssignment: (assignId, student) => {
    let id = ObjectId(student);
    let assid = ObjectId();
    let subassignment = {
      student: id,
      assignment: assid,
    };
    return new Promise(async (resolve, reject) => {
      let assignmnets = await db
        .main()
        .collection(collection.ASSIGNMENT_COLLECTION)
        .findOne({ _id: ObjectId(assignId), "assignments.student": id });
      if (
        db
          .main()
          .collection(collection.ASSIGNMENT_COLLECTION)
          .findOne({ _id: ObjectId(assignId) })
      ) {
        if (assignmnets) {
          resolve({ status: true });
        } else {
          db.main()
            .collection(collection.ASSIGNMENT_COLLECTION)
            .updateOne(
              { _id: ObjectId(assignId) },
              {
                $push: { assignments: subassignment },
              }
            )
            .then((response) => {
              resolve(assid);
            });
        }
      }
    });
  },
  attendAllPage: () => {
    return new Promise(async (resolve, reject) => {
      let datecheck =
        ("0" + new Date().getDate()).slice(-2) +
        "-" +
        ("0" + (new Date().getMonth() + 1)).slice(-2) +
        "-" +
        new Date().getFullYear();
  
        let dateexist = await db
            .main()
          .collection(collection.ATTENDANCE_COLLECTION)
          .findOne({ "attendance.date": datecheck });
        if (dateexist) {
          console.log("");
        } else {
          let studattend;
          let attendDetailObj;
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
          for (var i = 0; i < userfind.length; i++) {
            studattend = await db
              .main()
              .collection(collection.ATTENDANCE_COLLECTION)
              .findOne({ student: ObjectId(userfind[i]._id) });
            if (studattend) {
              let attendExist = studattend.attendance.findIndex(
                (attendanc) => attendanc.date == attendObj.date
              );
              if (attendExist == -1) {
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
            } else {
              var id = userfind[i];
              attendDetailObj = {
                student: id._id,
                attendance: [attendObj],
              };
              db.main()
                .collection(collection.ATTENDANCE_COLLECTION)
                .insertOne(attendDetailObj);
            }
          }
        }
    
    });
  },
  attendhome: (studId) => {
    return new Promise((resolve, reject) => {
      let datecheck =
        ("0" + new Date().getDate()).slice(-2) +
        "-" +
        ("0" + (new Date().getMonth() + 1)).slice(-2) +
        "-" +
        new Date().getFullYear();
      db.main()
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
              status: "$attendance.status",
            },
          },
          {
            $match: { attendate: datecheck },
          },
        ])
        .toArray()
        .then((attend) => {
          resolve(attend);
        });
    });
  },
  attendance: (date, studId) => {
    let datecheck =
      ("0" + new Date().getDate()).slice(-2) +
      "-" +
      ("0" + (new Date().getMonth() + 1)).slice(-2) +
      "-" +
      new Date().getFullYear(); 
    return new Promise(async (resolve, reject) => {
      if (!new Date().getDay() == 0) {
        if (date.Date == datecheck) {
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
        }
      }
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
              status: "$attendance.status",
            },
          },
          {
            $match: { attendate: datecheck },
          },
        ])
        .toArray();
      resolve(attend);
    });
  },
  getfullAttendance: (studId) => {
    return new Promise(async (resolve, reject) => {
      let month =
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
            $match: { month: month },
          },
        ])
        .sort({ attendate: -1 })
        .toArray();
      resolve(attend);
    });
  },
  totalDays: (studId) => {
    return new Promise(async (resolve, reject) => {
      let totalOpenDays = 0;
      let monthcheck =
        ("0" + (new Date().getMonth() + 1)).slice(-2) +
        "-" +
        new Date().getFullYear();
      let totalDays = await db
        .main()
        .collection(collection.ATTENDANCE_COLLECTION)
        .aggregate([
          {
            $match: { student: ObjectId(studId) },
          },
          {
            $match: { "attendance.month": monthcheck },
          },
          {
            $unwind: "$attendance",
          },
          {
            $project: {
              attendance: "$attendance",
            },
          },
        ])
        .toArray();
      for (var i = 0; i < totalDays.length; i++) {
        if (totalDays[i].attendance.status != "Holiday") totalOpenDays++;
      }
      resolve(totalOpenDays);
    });
  },
  totalDayPresent: (studId) => {
    return new Promise(async (resolve, reject) => {
      let daysPresent = 0;
      let monthcheck =
        ("0" + (new Date().getMonth() + 1)).slice(-2) +
        "-" +
        new Date().getFullYear();
      let days = await db
        .main()
        .collection(collection.ATTENDANCE_COLLECTION)
        .aggregate([
          {
            $match: { student: ObjectId(studId) },
          },
          {
            $match: { "attendance.month": monthcheck },
          },
          {
            $unwind: "$attendance",
          },
          {
            $project: {
              attendance: "$attendance",
            },
          },
        ])
        .toArray();
      for (var i = 0; i < days.length; i++) {
        if (days[i].attendance.status == "Present") daysPresent++;
      }
      resolve(daysPresent);
    });
  },
  totalDayAbsent: (studId) => {
    return new Promise(async (resolve, reject) => {
      let daysAbsent = 0;
      let monthcheck =
        ("0" + (new Date().getMonth() + 1)).slice(-2) +
        "-" +
        new Date().getFullYear();
      let days = await db
        .main()
        .collection(collection.ATTENDANCE_COLLECTION)
        .aggregate([
          {
            $match: { student: ObjectId(studId) },
          },
          {
            $match: { "attendance.month": monthcheck },
          },
          {
            $unwind: "$attendance",
          },
          {
            $project: {
              attendance: "$attendance",
            },
          },
        ])
        .toArray();
      for (var i = 0; i < days.length; i++) {
        if (days[i].attendance.status == "Absent") daysAbsent++;
      }
      resolve(daysAbsent);
    });
  },
  totalPercentage: (studId) => {
    return new Promise(async (resolve, reject) => {
      let totalOpenDays = 0;
      let monthcheck =
        ("0" + (new Date().getMonth() + 1)).slice(-2) +
        "-" +
        new Date().getFullYear();
      let totalDays = await db
        .main()
        .collection(collection.ATTENDANCE_COLLECTION)
        .aggregate([
          {
            $match: { student: ObjectId(studId) },
          },
          {
            $match: { "attendance.month": monthcheck },
          },
          {
            $unwind: "$attendance",
          },
          {
            $project: {
              attendance: "$attendance",
            },
          },
        ])
        .toArray();
      for (var i = 0; i < totalDays.length; i++) {
        if (totalDays[i].attendance.status != "Holiday") totalOpenDays++;
      }
      let numeratorTotal = 0;
      let numerator = await db
        .main()
        .collection(collection.ATTENDANCE_COLLECTION)
        .aggregate([
          {
            $match: { student: ObjectId(studId) },
          },
          {
            $match: { "attendance.month": monthcheck },
          },
          {
            $unwind: "$attendance",
          },
          {
            $project: {
              attendance: "$attendance",
            },
          },
          {
            $match: {
              $or: [
                { "attendance.status": "Present" },
                { "attendance.status": "Absent" },
              ],
            },
          },
        ])
        .toArray();
      for (var i = 0; i < numerator.length; i++) {
        numeratorTotal += numerator[i].attendance.percentage;
      }
      let percentage = numeratorTotal / totalOpenDays;
      resolve(percentage);
    });
  },
  totalMonthDays: (studId, monthcheck) => {
    return new Promise(async (resolve, reject) => {
      let totalOpenDays = 0;

      let totalDays = await db
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
              attendance: "$attendance",
            },
          },
          {
            $match: { "attendance.month": monthcheck },
          },
        ])
        .toArray();
      for (var i = 0; i < totalDays.length; i++) {
        if (totalDays[i].attendance.status != "Holiday") totalOpenDays++;
      }
      resolve(totalOpenDays);
    });
  },
  totalMonthDayPresent: (studId, monthcheck) => {
    return new Promise(async (resolve, reject) => {
      let daysPresent = 0;

      let days = await db
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
              attendance: "$attendance",
            },
          },
          {
            $match: { "attendance.month": monthcheck },
          },
        ])
        .toArray();
      for (var i = 0; i < days.length; i++) {
        if (days[i].attendance.status == "Present") daysPresent++;
      }
      resolve(daysPresent);
    });
  },
  totalMonthDayAbsent: (studId, monthcheck) => {
    return new Promise(async (resolve, reject) => {
      let daysAbsent = 0;

      let days = await db
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
              attendance: "$attendance",
            },
          },
          {
            $match: { "attendance.month": monthcheck },
          },
        ])
        .toArray();
      for (var i = 0; i < days.length; i++) {
        if (days[i].attendance.status == "Absent") daysAbsent++;
      }
      resolve(daysAbsent);
    });
  },
  totalMonthPercentage: (studId, monthcheck) => {
    return new Promise(async (resolve, reject) => {
      let totalOpenDays = 0;

      let totalDays = await db
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
              attendance: "$attendance",
            },
          },
          {
            $match: { "attendance.month": monthcheck },
          },
        ])
        .toArray();
      for (var i = 0; i < totalDays.length; i++) {
        if (totalDays[i].attendance.status != "Holiday") totalOpenDays++;
      }
      let numeratorTotal = 0;
      let numerator = await db
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
              attendance: "$attendance",
            },
          },
          {
            $match: { "attendance.month": monthcheck },
          },
        ])
        .toArray();
      for (var i = 0; i < numerator.length; i++) {
        if (numerator[i].attendance.status != "Holiday") {
          numeratorTotal += numerator[i].attendance.percentage;
        }
      }
      let percentage = numeratorTotal / totalOpenDays;
      resolve(percentage);
    });
  },
  getAnnounceDetails: (announceId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .main()
        .collection(collection.ANNOUNCEMENT_COLLECTION)
        .findOne({ _id: ObjectId(announceId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  getAttendDate: (date, studId) => {
    return new Promise(async (resolve, reject) => {
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
              date: "$attendance.date",
              month: "$attendance.month",
              status: "$attendance.status",
            },
          },
          {
            $match: { month: date },
          },
        ])
        .sort({ date: -1 })
        .toArray();
      resolve(attend);
    });
  },
  getPhotos: () => {
    return new Promise(async (resolve, reject) => {
      let photo = await db
        .main()
        .collection(collection.PHOTO_COLLECTION)
        .find()
        .sort({ _id: -1 })
        .toArray();
      resolve(photo);
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
  eventBook: (eventId, studId) => {
    return new Promise(async (resolve, reject) => {
      let paidevent = await db
        .main()
        .collection(collection.EVENT_COLLECTION)
        .findOne({ _id: ObjectId(eventId), Type: "Paid" });
      if (paidevent) {
        if (
          await db
            .main()
            .collection(collection.EVENT_COLLECTION)
            .findOne({ _id: ObjectId(eventId), students: ObjectId(studId) })
        ) {
          console.log("FOUND________________________");
        } else {
          db
            .main()
            .collection(collection.EVENT_COLLECTION)
            .updateOne(
              { _id: ObjectId(eventId) },
              {
                $push: { students: ObjectId(studId) },
              }
            ).then;
        }
      }
      resolve();
    });
  },
  generateRazorPay: (event, total) => {
    return new Promise((resolve, reject) => {
      var options = {
        amount: total * 100,
        currency: "INR",
        receipt: "" + event.eventId,
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err);
        } else {
          resolve(order);
        }
      });
    });
  },
  verifyPayment: (details, studId) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "GtVrMDo7vWDrDIWOZOc65ZFE");
      hmac.update(
        details["payment[razorpay_order_id]"] +
          "|" +
          details["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");
      if (hmac == details["payment[razorpay_signature]"]) {
        let paidObj = {
          student: ObjectId(studId),
          event: ObjectId(details["order[receipt]"]),
        };
        db.main().collection(collection.PAID_COLLECTION).insertOne(paidObj);
        resolve();
      } else {
        reject();
      }
    });
  },
  paytmAdd: (studId, eventId) => {
    return new Promise((resolve, reject) => {
      let paidObj = {
        student: ObjectId(studId),
        event: ObjectId(eventId),
      };
      db.main().collection(collection.PAID_COLLECTION).insertOne(paidObj);
      resolve();
    });
  },
  todayNotes: () => {
    let datecheck =
      ("0" + new Date().getDate()).slice(-2) +
      "-" +
      ("0" + (new Date().getMonth() + 1)).slice(-2) +
      "-" +
      new Date().getFullYear();
    return new Promise((resolve, reject) => {
      db.main()
        .collection(collection.NOTES_DOC_COLLECTION)
        .find({ Date: datecheck })
        .toArray()
        .then((response) => {
          resolve(response);
        });
    });
  },
  todayUtube: () => {
    let datecheck =
      ("0" + new Date().getDate()).slice(-2) +
      "-" +
      ("0" + (new Date().getMonth() + 1)).slice(-2) +
      "-" +
      new Date().getFullYear();
    return new Promise((resolve, reject) => {
      db.main()
        .collection(collection.NOTES_U_VID_COLLECTION)
        .find({ Date: datecheck })
        .toArray()
        .then((response) => {
          resolve(response);
        });
    });
  },
  todayVideo: () => {
    let datecheck =
      ("0" + new Date().getDate()).slice(-2) +
      "-" +
      ("0" + (new Date().getMonth() + 1)).slice(-2) +
      "-" +
      new Date().getFullYear();
    return new Promise((resolve, reject) => {
      db.main()
        .collection(collection.NOTES_VID_COLLECTION)
        .find({ Date: datecheck })
        .toArray()
        .then((response) => {
          resolve(response);
        });
    });
  },
  todayAssignments: () => {
    let datecheck =
      ("0" + new Date().getDate()).slice(-2) +
      "-" +
      ("0" + (new Date().getMonth() + 1)).slice(-2) +
      "-" +
      new Date().getFullYear();
    return new Promise((resolve, reject) => {
      db.main()
        .collection(collection.ASSIGNMENT_COLLECTION)
        .find({ "Topic.Date": datecheck })
        .toArray()
        .then((response) => {
          resolve(response);
        });
    });
  },
  getNotifications: () => {
    return new Promise(async (resolve, reject) => {
      let notifications = await db
        .main()
        .collection(collection.NOTI_COLLECTION)
        .find()
        .sort({ _id: -1 })
        .toArray();
      resolve(notifications);
    });
  },
  chat: (studName, studId, message, date) => {
    return new Promise((resolve, reject) => {
      db.main()
        .collection(collection.CHAT_COLLECTION)
        .insertOne({ name: studName, id: studId, message: message, date: date })
        .then((response) => {
          resolve(response);
        });
    });
  },
  pvtChat: (name, message, chatId, studId) => {
    return new Promise((resolve, reject) => {
      db.main()
        .collection(collection.PVT_CHAT_COLLECTION)
        .insertOne({
          name: name,
          studId: ObjectId(studId),
          chatId: ObjectId(chatId),
          message: message,
        })
        .then((response) => {
          resolve(response);
        });
    });
  },
  getChat: () => {
    return new Promise((resolve, reject) => {
      db.main()
        .collection(collection.CHAT_COLLECTION)
        .find()
        .sort({ _id: 1 })
        .toArray()
        .then((response) => {
          resolve(response);
        });
    });
  },
  getPvtChat: (studId, chatId) => {

    return new Promise((resolve, reject) => {
      db.main()
        .collection(collection.PVT_CHAT_COLLECTION)
        .aggregate([
          {
            $match: {
              $or: [
                {
                  studId: ObjectId(studId),
                  chatId: ObjectId(chatId),
                },
                {
                  studId: ObjectId(chatId),
                  chatId: ObjectId(studId),
                },
              ],
            },
          },
        ])
        .toArray()
        .then((response) => {
          resolve(response);
        });
    });
  },
  attendancenotify: (studId) => {
    return new Promise((resolve, reject) => {
      let datecheck =
        ("0" + new Date().getDate()).slice(-2) +
        "-" +
        ("0" + (new Date().getMonth() + 1)).slice(-2) +
        "-" +
        new Date().getFullYear();
      db.main()
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
              status: "$attendance.status",
            },
          },
          {
            $match: { attendate: datecheck },
          },
        ])
        .toArray()
        .then((response) => {
          if (response[0].status == "Absent") {
            console.log(response);
            resolve({ status: true });
          } else {
            resolve({ status: false });
          }
        });
    });
  },
  findPvtChat:(studId)=>{
    return new Promise((resolve,reject)=>{
      db.main().collection(collection.STUDENT_COLLECTION).findOne({_id:ObjectId(studId)}).then((response)=>{
        resolve(response)
      })
    })
  },
  getAllStudentsChat: (studId) => {
    return new Promise(async (resolve, reject) => {
      let students = await db
        .main()
        .collection(collection.STUDENT_COLLECTION)
        .find()
        .sort({ Rollno: 1 })
        .toArray();
        for(var i=0;i<students.length;i++){
          if(students[i]._id==studId){
            students.splice(i, i);
            break;
          }
        }
      resolve(students);
    });
  }
};
