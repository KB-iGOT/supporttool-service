import React, { useState, useEffect } from "react";
import { useActionIntercept } from "../../../Context/AppContext";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { Button, Autocomplete } from "@mui/material";
import TextField from "@mui/material/TextField";

const TICKET_HISTORY_KEY = 'ticketLinkHistory';

const JiraLinkPopup: React.FC = () => {
  const { isIntercepting, currentAction, completeAction, cancelAction } =
    useActionIntercept();
  const [jiraLink, setJiraLink] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (isIntercepting) {
      // Load history from localStorage when the dialog opens
      try {
        const storedHistory = localStorage.getItem(TICKET_HISTORY_KEY);
        setHistory(storedHistory ? JSON.parse(storedHistory) : []);
      } catch (e) {
        console.error("Failed to parse ticket history:", e);
        setHistory([]);
      }
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

  const handleInputChange = (
    event: React.SyntheticEvent,
    value: string
  ) => {
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
      // Add the new link to history, ensuring it's unique and trimming the list
      const newHistory = [jiraLink, ...history.filter(h => h !== jiraLink)].slice(0, 10);
      try {
        localStorage.setItem(TICKET_HISTORY_KEY, JSON.stringify(newHistory));
        setHistory(newHistory);
      } catch (e) {
        console.error("Failed to save ticket history:", e);
      }
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
          <Autocomplete
            freeSolo
            options={history}
            value={jiraLink}
            onInputChange={handleInputChange}
            renderInput={(params) => (
              <TextField
                {...params}
                autoFocus
                required
                margin="dense"
                id="ticketLink"
                name="ticketLink"
                label="Ticket URL"
                multiline
                maxRows={4}
                variant="standard"
                error={!!error}
                helperText={error || " "}
                placeholder="https://desk.zoho.in/agent/... or https://karmayogibharat.atlassian.net/..."
              />
            )}
          />
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
