import { Request, Response } from "express";
import { RequestHandler } from "express";
import axios from "axios"; // Use axios instead of request (which is deprecated)

export const getPrivateContent: RequestHandler = async (req: any, res: Response) => {
  try {
    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}api/content/v1/search`,
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTHORIZATION,
        "x-authenticated-user-token": req.user.token.trim(),
      },
      data: req.body // Pass the request body to the API
    });

    // If successful
    res.status(200).send(response.data);
  } catch (error) {
    console.error("❌ Error fetching contents:", error);

    // Check if it's an axios error with response
    if ((error as any).response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const axiosError = error as any; // Explicitly cast error to any
      res.status(axiosError.response.status).json({
        message: "Error from content API",
        error: axiosError.response.data,
      });
    } else if ((error as any).request) {
      // The request was made but no response was received
      res.status(503).json({
        message: "No response from content API",
        error: "Service unavailable",
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      res.status(500).json({
        message: "Internal server error",
        error: (error as any).message,
      });
    }
  }
};

// // New controller for public content search
// export const getPublicContent: RequestHandler = async (req: Request, res: Response) => {
//   try {
//     // Log the request body for debugging
//     console.log("📦 Search request:", JSON.stringify(req.body));
    
//     const response = await axios({
//       method: "POST",
//       url: `${process.env.KONG_API_URL}api/content/v1/search`,
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: process.env.AUTHORIZATION,
//       },
//       data: req.body // Pass the request body as is
//     });

//     // If successful
//     res.status(200).send(response.data);
//   } catch (error) {
//     console.error("❌ Error fetching public contents:", error);

//     // Check if it's an axios error with response
//     if ((error as any).response) {
//       const axiosError = error as any;
//       res.status(axiosError.response.status).json({
//         message: "Error from content API",
//         error: axiosError.response.data,
//       });
//     } else if ((error as any).request) {
//       res.status(503).json({
//         message: "No response from content API",
//         error: "Service unavailable",
//       });
//     } else {
//       res.status(500).json({
//         message: "Internal server error",
//         error: (error as any).message,
//       });
//     }
//   }
// };

// // Controller for content creation
// export const createContent: RequestHandler = async (req: any, res: Response) => {
//   try {
//     // Log the create request body
//     console.log("🆕 Create content request:", JSON.stringify(req.body));
    
//     const response = await axios({
//       method: "POST",
//       url: `${process.env.KONG_API_URL}api/private/content/v3/create`,
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: process.env.AUTHORIZATION,
//         "x-authenticated-user-token": req.user.token.trim(),
//       },
//       data: req.body
//     });

//     res.status(200).send(response.data);
//   } catch (error) {
//     console.error("❌ Error creating content:", error);

//     if ((error as any).response) {
//       const axiosError = error as any;
//       res.status(axiosError.response.status).json({
//         message: "Error from content creation API",
//         error: axiosError.response.data,
//       });
//     } else if ((error as any).request) {
//       res.status(503).json({
//         message: "No response from content API",
//         error: "Service unavailable",
//       });
//     } else {
//       res.status(500).json({
//         message: "Internal server error",
//         error: (error as any).message,
//       });
//     }
//   }
// };

// // Controller for content upload
// export const uploadContent: RequestHandler = async (req: any, res: Response) => {
//   try {
//     // Get content ID from URL params
//     const contentId = req.params.contentId;
    
//     if (!contentId) {
//       return res.status(400).json({
//         message: "Content ID is required",
//       });
//     }
    
//     if (!req.files || !req.files.data) {
//       return res.status(400).json({
//         message: "File is required",
//       });
//     }

//     // Create form data for file upload
//     const formData = new FormData();
//     const file = req.files.data;
    
//     // Add file to form data
//     formData.append('data', file.data, {
//       filename: file.name,
//       contentType: file.mimetype,
//     });

//     console.log(`📤 Uploading file ${file.name} for content ID: ${contentId}`);
    
//     const response = await axios({
//       method: "POST",
//       url: `${process.env.KONG_API_URL}api/private/content/v3/upload/${contentId}`,
//       headers: {
//         "Content-Type": "multipart/form-data",
//         Authorization: process.env.AUTHORIZATION,
//         "x-authenticated-user-token": req.user.token.trim(),
//       },
//       data: formData
//     });

//     res.status(200).send(response.data);
//   } catch (error) {
//     console.error("❌ Error uploading content:", error);

//     if ((error as any).response) {
//       const axiosError = error as any;
//       res.status(axiosError.response.status).json({
//         message: "Error from content upload API",
//         error: axiosError.response.data,
//       });
//     } else if ((error as any).request) {
//       res.status(503).json({
//         message: "No response from content API",
//         error: "Service unavailable",
//       });
//     } else {
//       res.status(500).json({
//         message: "Internal server error",
//         error: (error as any).message,
//       });
//     }
//   }
// };

// // Controller for updating content
// export const updateContent: RequestHandler = async (req: any, res: Response) => {
//   try {
//     // Log the update request body
//     console.log("🔄 Update content request:", JSON.stringify(req.body));
    
//     const response = await axios({
//       method: "POST",
//       url: `${process.env.KONG_API_URL}api/private/content/v3/update`,
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: process.env.AUTHORIZATION,
//         "x-authenticated-user-token": req.user.token.trim(),
//       },
//       data: req.body
//     });

//     res.status(200).send(response.data);
//   } catch (error) {
//     console.error("❌ Error updating content:", error);

//     if ((error as any).response) {
//       const axiosError = error as any;
//       res.status(axiosError.response.status).json({
//         message: "Error from content update API",
//         error: axiosError.response.data,
//       });
//     } else if ((error as any).request) {
//       res.status(503).json({
//         message: "No response from content API",
//         error: "Service unavailable",
//       });
//     } else {
//       res.status(500).json({
//         message: "Internal server error",
//         error: (error as any).message,
//       });
//     }
//   }
// };