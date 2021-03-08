import { useQuery, gql } from '@apollo/client';
import moment from 'moment';

const GET_TIMELOCK = gql`
  query GetTimelock {
    timelock(id: "t") {
      time
      pendingTime
      pendingConfirmAfter
    }
  }
`;

function Timelock() {
  const { loading, error, data } = useQuery(GET_TIMELOCK);

  let timelockInfo, pendingChange;
  if (data) {
    const { time, pendingTime, pendingConfirmAfter } = data.timelock;
    const epoch = moment(0);
    const timeStr = moment.unix(parseInt(time)).from(epoch, true);
    timelockInfo = `Current timelock: ${timeStr}`;

    pendingChange = "No pending change to the timelock";
    if (pendingTime) {
      const pendingTimeStr = moment.unix(parseInt(pendingTime)).from(epoch, true);
      const pendingConfirmAfterStr = moment.unix(parseInt(pendingConfirmAfter)).from(epoch, true);
      pendingChange = `Update in progress. Timelock will be changed to ${pendingTimeStr} after ${pendingConfirmAfterStr}`;
    }
    
  } else if (error) {
    timelockInfo = "Failed to load timelock";
    console.log(error);
  } else if (loading) {
    timelockInfo = "Timelock loading...";
  } else {
    timelockInfo = "Timelock not found";
  }

  return (
    <code>
        {timelockInfo}
        {pendingChange ? <br /> : null}
        {pendingChange}
    </code>
  );
}

export default Timelock;
