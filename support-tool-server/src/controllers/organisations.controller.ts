import { Request, Response } from "express";
import { RequestHandler } from "express";
import request from "request";

export const fetchOrganisations: RequestHandler = async (
  req: Request,
  res: Response
) => {

  try {
    var options = {
      method: "POST",
      url: `${process.env.KONG_API_URL}api/org/v1/search`,
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTHORIZATION,
      },
      body: JSON.stringify({
        request: {
          filters: {
            isRootOrg: true,
          },
          offset: 0,
          limit: 1000,
          sort_by: {},
          fields: [],
        },
      }),
    };

    request(options, function (error, response, body) {
      if (error != null) {
        console.error("❌ Error fetching organisations:", error);
        res
          .status(500)
          .json({ message: "Internal server error", error: error.message });
      } else {
        if (!error && body) {
          if (body) {
            res
              .status(200)
              .send(body);
          } else {
            res
              .status(500)
              .send({ status: 500, message: "Internal server error" });
          }
        } else {
          res
            .status(500)
            .send({ status: 500, message: "Internal server error" });
        }
      }
    });
  } catch (error) {
    console.error("❌ Error fetching organisations:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};
