import PropTypes from "prop-types";
import React, { useState, useEffect } from "react";
import { StyleSheet, css } from "aphrodite";
import Button from "@material-ui/core/Button";
import LinearProgress from "@material-ui/core/LinearProgress";
import Typography from '@material-ui/core/Typography';
import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';
 
// This is because the Toolbar from material-ui seems to only apply the correct margins if the
// immediate child is a Button or other type it recognizes. Can get rid of this if we remove material-ui
const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexFlow: "column",
    alignItems: "center",
    width: "30%",
    maxWidth: 300,
    height: "100%",
    marginTop: 10,
    marginRight: "auto",
    marginLeft: "auto"
  },
  progressContainer: {
    width: "100%"
  },
  progressText: {
    position: "relative", 
    textAlign: "center",
    color: "white"
  },
  progressBarRoot: {
    height: 10,
    borderRadius: 5
  }
});

function BulkSendButton({
  assignment, setDisabled, bulkSendMessages, refreshData, onFinishContact
}) {
  const totalChunkSize = window.BULK_SEND_CHUNK_SIZE;
  const [isSending, setIsSending] = useState(false);
  const [totalSentMessages, setTotalSentMessages] = useState(0);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const sendMessages = async () => {
    try {
      const { data } = await bulkSendMessages(assignment.id);
      const sentMessages = data.bulkSendMessages.length;
      const updatedTotalSent = totalSentMessages + sentMessages;

      if (!sentMessages) {
        /* end sending if no messages were left to send */
        setProgress(100);
      } else {
        setTotalSentMessages(updatedTotalSent);
        setProgress((updatedTotalSent / totalChunkSize) * 100);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message);
    }
  }

  const handleEndSend = () => {
    refreshData();
    setErrorMessage('');
    setIsSending(false);
    setProgress(0);
    setTotalSentMessages(0);
    setDisabled(false);
    onFinishContact();
  }

  useEffect(() => {
    if (isSending) {
      /* sendMessages will be called the first time when isSending is set to true
         and only called again when the progress state is updated and not complete */
      if (progress < 100) {
        sendMessages();
      } else {
        /* display "sent all" message for half a sec */
        setTimeout(handleEndSend, 500);
      }
    }
  }, [isSending, progress]);

  return (
    <div className={css(styles.container)}>
      {isSending ? (
        <div className={css(styles.progressContainer)}>
          <div className={css(styles.progressText)}>
            <Typography variant="subtitle1">
              {progress === 100 
                ? 'Sent all messages!'
                : `Sent ${totalSentMessages} of ${totalChunkSize} messages...`}
            </Typography>
          </div>
          <LinearProgress 
            variant="determinate"
            value={progress}
            classes={{ root: css(styles.progressBarRoot) }}
          />
        </div>
      ) : (
        <Button
          onClick={() => setIsSending(true)}
          disabled={isSending}
          color="primary"
          variant="contained"
        >
          {`Send Bulk (${totalChunkSize})`}
        </Button>
      )}
      <Snackbar 
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={!!errorMessage} 
        autoHideDuration={6000} 
        onClose={handleEndSend}
      >
        <Alert 
          onClose={handleEndSend} 
          severity="error"
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}

BulkSendButton.propTypes = {
  assignment: PropTypes.shape({ id: PropTypes.number }).isRequired,
  onFinishContact: PropTypes.func.isRequired,
  bulkSendMessages: PropTypes.func.isRequired,
  refreshData: PropTypes.func.isRequired,
  setDisabled: PropTypes.func.isRequired
};

export default BulkSendButton;
