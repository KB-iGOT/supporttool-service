import React, { useState, useEffect } from "react";
import { useActionIntercept } from "../../../Context/AppContext";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { Button } from "@mui/material";
import TextField from "@mui/material/TextField";

const JiraLinkPopup: React.FC = () => {
  const { isIntercepting, currentAction, completeAction, cancelAction } =
    useActionIntercept();
  const [jiraLink, setJiraLink] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isIntercepting) {
      setJiraLink("");
      setIsValid(false);
      setError("");
    }
  }, [isIntercepting]);

  const validateTicketLink = (value: string) => {
    // Match Jira tickets
    const jiraPattern =
      /^https:\/\/karmayogibharat\.atlassian\.net\/browse\/[A-Z]+-\d+$/;

    // Match Zoho Desk tickets
    const zohoPattern =
      /^https:\/\/desk\.zoho\.in\/agent\/karmayogibharat\/karmayogi-bharat\/tickets\/details\/\d+$/;

    // Return true if either pattern matches
    return jiraPattern.test(value) || zohoPattern.test(value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setJiraLink(value);

    if (!value.trim()) {
      setError("Ticket link is required");
      setIsValid(false);
    } else if (!validateTicketLink(value)) {
      setError("Please enter a valid Jira or Zoho Desk ticket URL");
      setIsValid(false);
    } else {
      setError("");
      setIsValid(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      completeAction(jiraLink);
    }
  };

  if (!isIntercepting) return null;

  const getActionTitle = () => {
    const type = currentAction?.type.toLowerCase() || "";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <Dialog
      open={isIntercepting}
      slotProps={{
        paper: {
          component: "form",
          onSubmit: handleSubmit,
        },
      }}
    >
      <DialogTitle>Link {getActionTitle()} Action to Ticket</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Please provide a Jira or Zoho Desk ticket link associated with this action.
        </DialogContentText>

        <div className="mb-4">
          <TextField
            autoFocus
            required
            margin="dense"
            id="ticketLink"
            name="ticketLink"
            label="Ticket URL"
            autoComplete="url"
            multiline
            maxRows={4}
            fullWidth
            variant="standard"
            value={jiraLink}
            onChange={handleChange}
            placeholder="https://desk.zoho.in/agent/... or https://karmayogibharat.atlassian.net/..."
          />
          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={cancelAction}>Cancel</Button>
        <Button type="submit" disabled={!isValid}>Submit</Button>
      </DialogActions>
    </Dialog>
  );
};

export default JiraLinkPopup;
