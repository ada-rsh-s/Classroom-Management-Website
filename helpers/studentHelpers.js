import db from "../config/connection.js";
import collection from "../config/collections.js";
import { response } from "express";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import Razorpay from "razorpay";

const instance = new Razorpay({
  key_id: "rzp_test_BTghMaFUWF72Za",
  key_secret: "GtVrMDo7vWDrDIWOZOc65ZFE",
});

const doStudentLogin = (studentDetails) => {
  const response = {};
  return new Promise(async (resolve, reject) => {
    const student = await db
      .get()
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
};

const phoneNoCheck = (studentDetails) => {
  return new Promise(async (resolve, reject) => {
    const response = {};
    let status;
    const phone = await db
      .get()
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
};

const OtpCheck = (studentDetails) => {
  return new Promise(async (resolve, reject) => {
    resolve(studentDetails.otp);
  });
};

const userTest = (studId) => {
  return new Promise(async (resolve, reject) => {
    const userexist = await db
      .get()
      .collection(collection.STUDENT_COLLECTION)
      .findOne({ _id: new ObjectId(studId) });
    if (userexist) {
      resolve({ status: true });
    } else {
      resolve({ status: false });
    }
  });
};

const Notes = () => {
  return new Promise(async (resolve, reject) => {
    const doc = await db
      .get()
      .collection(collection.NOTES_DOC_COLLECTION)
      .find()
      .sort({ _id: -1 })
      .toArray();
    resolve(doc);
  });
};

const videoNotes = () => {
  return new Promise(async (resolve, reject) => {
    const video = await db
      .get()
      .collection(collection.NOTES_VID_COLLECTION)
      .find()
      .sort({ _id: -1 })
      .toArray();
    resolve(video);
  });
};

const utubeNotes = () => {
  return new Promise(async (resolve, reject) => {
    const uvideo = await db
      .get()
      .collection(collection.NOTES_U_VID_COLLECTION)
      .find()
      .sort({ _id: -1 })
      .toArray();
    resolve(uvideo);
  });
};

const viewAssign = () => {
  return new Promise(async (resolve, reject) => {
    let assign = await db
      .get()
      .collection(collection.ASSIGNMENT_COLLECTION)
      .find()
      .sort({ _id: -1 })
      .toArray();
    resolve(assign);
  });
};

const assignMarks = (studId) => {
  return new Promise(async (resolve, reject) => {
    let assign = await db
      .get()
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
          $match: { student: new ObjectId(studId) },
        },
      ])
      .toArray();
    resolve(assign);
  });
};

// const subAssign = (assignId) => {
//   return new Promise((resolve, reject) => {
//     db.get()
//       .collection(collection.ASSIGNMENT_COLLECTION)
//       .findOne({ _id: new ObjectId(assignId) });
//     resolve(response);
//   });
// };

const submitAssignment = (assignId, student) => {
  let id = new ObjectId(student);
  let assid = new ObjectId();
  let subassignment = {
    student: id,
    assignment: assid,
  };
  return new Promise(async (resolve, reject) => {
    console.log(assignId,student);
    
    let assignmnets = await db
      .get()
      .collection(collection.ASSIGNMENT_COLLECTION)
      .findOne({ _id: new ObjectId(assignId), "assignments.student": id });
    if (
      db
        .get()
        .collection(collection.ASSIGNMENT_COLLECTION)
        .findOne({ _id: new ObjectId(assignId) })
    ) {
      if (assignmnets) {
        resolve({ status: true });
      } else {
        db.get()
          .collection(collection.ASSIGNMENT_COLLECTION)
          .updateOne(
            { _id: new ObjectId(assignId) },
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
};

const attendAllPage = () => {
  let attendObj;
  return new Promise(async (resolve, reject) => {
    let datecheck =
      ("0" + new Date().getDate()).slice(-2) +
      "-" +
      ("0" + (new Date().getMonth() + 1)).slice(-2) +
      "-" +
      new Date().getFullYear();

    let dateexist = await db
      .get()
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
        .get()
        .collection(collection.STUDENT_COLLECTION)
        .aggregate([
          {
            $project: {
              _id: "$_id",
            },
          },
        ])
        .toArray();
      for (let i = 0; i < userfind.length; i++) {
        studattend = await db
          .get()
          .collection(collection.ATTENDANCE_COLLECTION)
          .findOne({ student: new ObjectId(userfind[i]._id) });
        if (studattend) {
          let attendExist = studattend.attendance.findIndex(
            (attendanc) => attendanc.date == attendObj.date
          );
          if (attendExist == -1) {
            db.get()
              .collection(collection.ATTENDANCE_COLLECTION)
              .updateOne(
                { student: new ObjectId(userfind[i]._id) },
                {
                  $push: { attendance: attendObj },
                }
              )
              .then((response) => {
                resolve();
              });
          }
        } else {
          const id = userfind[i];
          attendDetailObj = {
            student: id._id,
            attendance: [attendObj],
          };
          db.get()
            .collection(collection.ATTENDANCE_COLLECTION)
            .insertOne(attendDetailObj);
        }
      }
    }
  });
};

const attendhome = (studId) => {
  return new Promise((resolve, reject) => {
    let datecheck =
      ("0" + new Date().getDate()).slice(-2) +
      "-" +
      ("0" + (new Date().getMonth() + 1)).slice(-2) +
      "-" +
      new Date().getFullYear();
    db.get()
      .collection(collection.ATTENDANCE_COLLECTION)
      .aggregate([
        {
          $match: { student: new ObjectId(studId) },
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
};

const attendance = (date, studId) => {
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
          .get()
          .collection(collection.ATTENDANCE_COLLECTION)
          .updateOne(
            { student: new ObjectId(studId), "attendance.date": datecheck },
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
      .get()
      .collection(collection.ATTENDANCE_COLLECTION)
      .aggregate([
        {
          $match: { student: new ObjectId(studId) },
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
};

const getfullAttendance = (studId) => {
  return new Promise(async (resolve, reject) => {
    let month =
      ("0" + (new Date().getMonth() + 1)).slice(-2) +
      "-" +
      new Date().getFullYear();
    let attend = await db
      .get()
      .collection(collection.ATTENDANCE_COLLECTION)
      .aggregate([
        {
          $match: { student: new ObjectId(studId) },
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
};

const totalDays = (studId) => {
  return new Promise(async (resolve, reject) => {
    let totalOpenDays = 0;
    let monthcheck =
      ("0" + (new Date().getMonth() + 1)).slice(-2) +
      "-" +
      new Date().getFullYear();
    let totalDays = await db
      .get()
      .collection(collection.ATTENDANCE_COLLECTION)
      .aggregate([
        {
          $match: { student: new ObjectId(studId) },
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
    for (let i = 0; i < totalDays.length; i++) {
      if (totalDays[i].attendance.status != "Holiday") totalOpenDays++;
    }
    resolve(totalOpenDays);
  });
};
const totalDayPresent = (studId) => {
  return new Promise(async (resolve, reject) => {
    let daysPresent = 0;
    let monthcheck =
      ("0" + (new Date().getMonth() + 1)).slice(-2) +
      "-" +
      new Date().getFullYear();
    let days = await db
      .get()
      .collection(collection.ATTENDANCE_COLLECTION)
      .aggregate([
        {
          $match: { student: new ObjectId(studId) },
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
    for (let i = 0; i < days.length; i++) {
      if (days[i].attendance.status == "Present") daysPresent++;
    }
    resolve(daysPresent);
  });
};

const totalDayAbsent = (studId) => {
  return new Promise(async (resolve, reject) => {
    let daysAbsent = 0;
    let monthcheck =
      ("0" + (new Date().getMonth() + 1)).slice(-2) +
      "-" +
      new Date().getFullYear();
    let days = await db
      .get()
      .collection(collection.ATTENDANCE_COLLECTION)
      .aggregate([
        {
          $match: { student: new ObjectId(studId) },
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
    for (let i = 0; i < days.length; i++) {
      if (days[i].attendance.status == "Absent") daysAbsent++;
    }
    resolve(daysAbsent);
  });
};

const totalPercentage = (studId) => {
  return new Promise(async (resolve, reject) => {
    let totalOpenDays = 0;
    let monthcheck =
      ("0" + (new Date().getMonth() + 1)).slice(-2) +
      "-" +
      new Date().getFullYear();
    let totalDays = await db
      .get()
      .collection(collection.ATTENDANCE_COLLECTION)
      .aggregate([
        {
          $match: { student: new ObjectId(studId) },
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
    for (let i = 0; i < totalDays.length; i++) {
      if (totalDays[i].attendance.status != "Holiday") totalOpenDays++;
    }
    let numeratorTotal = 0;
    let numerator = await db
      .get()
      .collection(collection.ATTENDANCE_COLLECTION)
      .aggregate([
        {
          $match: { student: new ObjectId(studId) },
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
    for (let i = 0; i < numerator.length; i++) {
      numeratorTotal += numerator[i].attendance.percentage;
    }
    let percentage = numeratorTotal / totalOpenDays;
    resolve(percentage);
  });
};

const totalMonthDays = (studId, monthcheck) => {
  return new Promise(async (resolve, reject) => {
    let totalOpenDays = 0;

    let totalDays = await db
      .get()
      .collection(collection.ATTENDANCE_COLLECTION)
      .aggregate([
        {
          $match: { student: new ObjectId(studId) },
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
    for (let i = 0; i < totalDays.length; i++) {
      if (totalDays[i].attendance.status != "Holiday") totalOpenDays++;
    }
    resolve(totalOpenDays);
  });
};

const totalMonthDayPresent = (studId, monthcheck) => {
  return new Promise(async (resolve, reject) => {
    let daysPresent = 0;

    let days = await db
      .get()
      .collection(collection.ATTENDANCE_COLLECTION)
      .aggregate([
        {
          $match: { student: new ObjectId(studId) },
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
    for (let i = 0; i < days.length; i++) {
      if (days[i].attendance.status == "Present") daysPresent++;
    }
    resolve(daysPresent);
  });
};

const totalMonthDayAbsent = (studId, monthcheck) => {
  return new Promise(async (resolve, reject) => {
    let daysAbsent = 0;

    let days = await db
      .get()
      .collection(collection.ATTENDANCE_COLLECTION)
      .aggregate([
        {
          $match: { student: new ObjectId(studId) },
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
    for (let i = 0; i < days.length; i++) {
      if (days[i].attendance.status == "Absent") daysAbsent++;
    }
    resolve(daysAbsent);
  });
};

const totalMonthPercentage = (studId, monthcheck) => {
  return new Promise(async (resolve, reject) => {
    let totalOpenDays = 0;

    let totalDays = await db
      .get()
      .collection(collection.ATTENDANCE_COLLECTION)
      .aggregate([
        {
          $match: { student: new ObjectId(studId) },
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
    for (let i = 0; i < totalDays.length; i++) {
      if (totalDays[i].attendance.status != "Holiday") totalOpenDays++;
    }
    let numeratorTotal = 0;
    let numerator = await db
      .get()
      .collection(collection.ATTENDANCE_COLLECTION)
      .aggregate([
        {
          $match: { student: new ObjectId(studId) },
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
    for (let i = 0; i < numerator.length; i++) {
      if (numerator[i].attendance.status != "Holiday") {
        numeratorTotal += numerator[i].attendance.percentage;
      }
    }
    let percentage = numeratorTotal / totalOpenDays;
    resolve(percentage);
  });
};

const getAnnounceDetails = (announceId) => {
  return new Promise(async (resolve, reject) => {
    await db
      .get()
      .collection(collection.ANNOUNCEMENT_COLLECTION)
      .findOne({ _id: new ObjectId(announceId) })
      .then((response) => {
        resolve(response);
      });
  });
};

const getAttendDate = (date, studId) => {
  return new Promise(async (resolve, reject) => {
    let attend = await db
      .get()
      .collection(collection.ATTENDANCE_COLLECTION)
      .aggregate([
        {
          $match: { student: new ObjectId(studId) },
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
};

const getPhotos = () => {
  return new Promise(async (resolve, reject) => {
    let photo = await db
      .get()
      .collection(collection.PHOTO_COLLECTION)
      .find()
      .sort({ _id: -1 })
      .toArray();
    resolve(photo);
  });
};

const getEventDetails = (eventId) => {
  eventId = new ObjectId(eventId);//debug line
  console.log(eventId);
  
  return new Promise(async (resolve, reject) => {
    await db
      .get()
      .collection(collection.EVENT_COLLECTION)
      .findOne({ _id: new ObjectId(eventId) })
      .then((response) => {
        resolve(response);
      });
  });
};

const eventBook = (eventId, studId) => {
  return new Promise(async (resolve, reject) => {
    let paidevent = await db
      .get()
      .collection(collection.EVENT_COLLECTION)
      .findOne({ _id: new ObjectId(eventId), Type: "Paid" });
    if (paidevent) {
      if (
        await db
          .get()
          .collection(collection.EVENT_COLLECTION)
          .findOne({
            _id: new ObjectId(eventId),
            students: new ObjectId(studId),
          })
      ) {
        console.log("FOUND________________________");
      } else {
        db
          .get()
          .collection(collection.EVENT_COLLECTION)
          .updateOne(
            { _id: new ObjectId(eventId) },
            {
              $push: { students: new ObjectId(studId) },
            }
          ).then;
      }
    }
    resolve();
  });
};

const generateRazorPay = (event, total) => {
  return new Promise((resolve, reject) => {
    const options = {
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
};

const verifyPayment = (details, studId) => {
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
        student: new ObjectId(studId),
        event: new ObjectId(details["order[receipt]"]),
      };
      db.get().collection(collection.PAID_COLLECTION).insertOne(paidObj);
      resolve();
    } else {
      reject();
    }
  });
}; 

const paytmAdd = (studId, eventId) => {
  return new Promise((resolve, reject) => {
    let paidObj = {
      student: new ObjectId(studId),
      event: new ObjectId(eventId),
    };
    db.get().collection(collection.PAID_COLLECTION).insertOne(paidObj);
    resolve();
  });
};

const todayNotes = () => {
  let datecheck =
    ("0" + new Date().getDate()).slice(-2) +
    "-" +
    ("0" + (new Date().getMonth() + 1)).slice(-2) +
    "-" +
    new Date().getFullYear();
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.NOTES_DOC_COLLECTION)
      .find({ Date: datecheck })
      .toArray()
      .then((response) => {
        resolve(response);
      });
  });
};

const todayUtube = () => {
  let datecheck =
    ("0" + new Date().getDate()).slice(-2) +
    "-" +
    ("0" + (new Date().getMonth() + 1)).slice(-2) +
    "-" +
    new Date().getFullYear();
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.NOTES_U_VID_COLLECTION)
      .find({ Date: datecheck })
      .toArray()
      .then((response) => {
        resolve(response);
      });
  });
};

const todayVideo = () => {
  let datecheck =
    ("0" + new Date().getDate()).slice(-2) +
    "-" +
    ("0" + (new Date().getMonth() + 1)).slice(-2) +
    "-" +
    new Date().getFullYear();
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.NOTES_VID_COLLECTION)
      .find({ Date: datecheck })
      .toArray()
      .then((response) => {
        resolve(response);
      });
  });
};

const todayAssignments = () => {
  let datecheck =
    ("0" + new Date().getDate()).slice(-2) +
    "-" +
    ("0" + (new Date().getMonth() + 1)).slice(-2) +
    "-" +
    new Date().getFullYear();
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.ASSIGNMENT_COLLECTION)
      .find({ "Topic.Date": datecheck })
      .toArray()
      .then((response) => {
        resolve(response);
      });
  });
};

const getNotifications = () => {
  return new Promise(async (resolve, reject) => {
    let notifications = await db
      .get()
      .collection(collection.NOTI_COLLECTION)
      .find()
      .sort({ _id: -1 })
      .toArray();
    resolve(notifications);
  });
};

const chat = (studName, studId, message, date) => {
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.CHAT_COLLECTION)
      .insertOne({ name: studName, id: studId, message: message, date: date })
      .then((response) => {
        resolve(response);
      });
  });
};

const pvtChat = (name, message, chatId, studId) => {
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.PVT_CHAT_COLLECTION)
      .insertOne({
        name: name,
        studId: new ObjectId(studId),
        chatId: new ObjectId(chatId),
        message: message,
      })
      .then((response) => {
        resolve(response);
      });
  });
};

const getChat = () => {
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.CHAT_COLLECTION)
      .find()
      .sort({ _id: 1 })
      .toArray()
      .then((response) => {
        resolve(response);
      });
  });
};

const getPvtChat = (studId, chatId) => {
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.PVT_CHAT_COLLECTION)
      .aggregate([
        {
          $match: {
            $or: [
              {
                studId: new ObjectId(studId),
                chatId: new ObjectId(chatId),
              },
              {
                studId: new ObjectId(chatId),
                chatId: new ObjectId(studId),
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
};

const attendancenotify = (studId) => {
  return new Promise((resolve, reject) => {
    let datecheck =
      ("0" + new Date().getDate()).slice(-2) +
      "-" +
      ("0" + (new Date().getMonth() + 1)).slice(-2) +
      "-" +
      new Date().getFullYear();
    db.get()
      .collection(collection.ATTENDANCE_COLLECTION)
      .aggregate([
        {
          $match: { student: new ObjectId(studId) },
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
};

const findPvtChat = (studId) => {
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.STUDENT_COLLECTION)
      .findOne({ _id: new ObjectId(studId) })
      .then((response) => {
        resolve(response);
      });
  });
};

const getAllStudentsChat = (studId) => {
  return new Promise(async (resolve, reject) => {
    let students = await db
      .get()
      .collection(collection.STUDENT_COLLECTION)
      .find()
      .sort({ Rollno: 1 })
      .toArray();
    for (let i = 0; i < students.length; i++) {
      if (students[i]._id == studId) {
        students.splice(i, i);
        break;
      }
    }
    resolve(students);
  });
};

export default {
  doStudentLogin,
  phoneNoCheck,
  OtpCheck,
  userTest,
  Notes,
  videoNotes,
  utubeNotes,
  viewAssign,
  assignMarks,
  // subAssign,
  submitAssignment,
  attendAllPage,
  attendhome,
  attendance,
  getfullAttendance,
  totalDays,
  totalDayPresent,
  totalDayAbsent,
  totalPercentage,
  totalMonthDays,
  totalMonthDayPresent,
  totalMonthDayAbsent,
  totalMonthPercentage,
  getAnnounceDetails,
  getAttendDate,
  getPhotos,
  getEventDetails,
  eventBook,
  generateRazorPay,
  verifyPayment,
  paytmAdd,
  todayNotes,
  todayUtube,
  todayVideo,
  todayAssignments,
  getNotifications,
  chat,
  pvtChat,
  getChat,
  getPvtChat,
  attendancenotify,
  findPvtChat,
  getAllStudentsChat,
};
