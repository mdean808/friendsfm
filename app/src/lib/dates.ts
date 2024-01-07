export const formatDurationPlayed = (duration: number) => {
  const d = new Date(Date.UTC(0, 0, 0, 0, 0, 0, duration * 1000));
  return d.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
};

export const formatTimePlayed = (time: number = Date.now()) => {
  const date = new Date(time);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

export const getShortDate = (date: Date) => {
  const monthNames = [
    'jan.',
    'feb.',
    'mar.',
    'apr.',
    'may',
    'jun.',
    'jul.',
    'aug.',
    'sep.',
    'oct.',
    'nov.',
    'dec.',
  ];
  const monthIndex = date.getMonth();
  const day = date.getDate();
  let ordinalIndicator = 'th';
  if (day === 1 || day === 21 || day === 31) {
    ordinalIndicator = 'st';
  } else if (day === 2 || day === 22) {
    ordinalIndicator = 'nd';
  } else if (day === 3 || day === 23) {
    ordinalIndicator = 'rd';
  }
  return `${monthNames[monthIndex]} ${day}${ordinalIndicator}`;
};

export const getDaysAgo = (date: Date) => {
  const currDate = new Date();
  const diffDays = currDate.getDate() - date.getDate();
  switch (diffDays) {
    case 0:
      return 'today';
    case 1:
      return 'yesterday';
    default:
      return `${diffDays} days ago`;
  }
};

export const convertDateToLateString = (date: Date) => {
  if (isNaN(date.getTime())) return 'infinitely late';
  const rootDate = new Date(0);
  const days = daysBetweenDates(rootDate, date);
  const hours = Math.floor(
    Math.abs(rootDate.getTime() - date.getTime()) / 36e5
  );
  const minutes = date.getMinutes() - rootDate.getMinutes();
  const seconds = date.getSeconds() - rootDate.getSeconds();
  let res = '';
  if (days <= 2 && hours === 0 && minutes === 0) res = seconds + 's late';
  else if (days <= 2 && hours === 0) res = minutes + ' min late';
  else if (days <= 2) res = hours + ' hr late';
  else res = days + ' days late';
  return res;
};

export const daysBetweenDates = (date1: Date, date2: Date) =>
  Math.ceil(
    Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24)
  );
