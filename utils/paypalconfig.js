import got from "got";
import dotenv from "dotenv";
dotenv.config();
const generateAccessToken = async () => {
  try {
    const response = await got.post(
      process.env.PAYPAL_BASE_URL + "/v1/oauth2/token",
      {
        username: process.env.PAYPAL_CLIENT_ID,
        password: process.env.PAYPAL_SECRET,
        form: {
          grant_type: "client_credentials",
        },
        responseType: "json",
      }
    );

    return response.body.access_token;
  } catch (error) {
    console.log("Error:", error.response?.body || error.message);
  }
};
const createOrder = async (accessToken, reqData) => {
    console.log(accessToken);
    
    try {
    const response = await got.post(
      process.env.PAYPAL_BASE_URL + "/v2/checkout/orders",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        json: {
          intent: "CAPTURE",
          purchase_units: [
            {
              items: [
                {
                  name: "Class Event registration",
                  quantity: "1",
                  unit_amount: {
                    currency_code: "USD",
                    value: reqData.amount,
                  },
                },
              ],
              amount: {
                currency_code: "USD",
                value: reqData.amount,
                breakdown: {
                  item_total: {
                    currency_code: "USD",
                    value: reqData.amount,
                  },
                },
              },
              custom_id: JSON.stringify({
                studId: reqData.studId,
                eventId: reqData.eventId,
              }),
            },
          ],
          application_context: {
            return_url: `${process.env.BASE_URL}/paypalsuccess`,
            cancel_url: `${process.env.BASE_URL}/failed`,
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
            brand_name: "E-Classroom",
          },
        },
        responseType: "json", // Make sure Got parses the response
      }
    );

    return response.body.links.find((link) => link.rel === "approve");
  } catch (error) {
    console.error(
      "Error creating order:",
      error.response?.body || error.message
    );
    throw error;
  }
};

const captureOrder = async (accessToken, orderId) => {
  try {
    const response = await got.post(
      `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        responseType: "json",
      }
    );

    return response.body;
  } catch (error) {
    console.error(
      "Error capturing order:",
      error.response?.body || error.message
    );
    throw error;
  }
};

export { generateAccessToken, createOrder,captureOrder };
