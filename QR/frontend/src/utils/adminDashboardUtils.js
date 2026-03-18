export const formatDateTime = (value) => {
  if (!value) return "--";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export const formatStatusLabel = (value) => value.replaceAll("_", " ");

export const maskToken = (token) => (!token ? "--" : token.length <= 16 ? token : `${token.slice(0, 8)}...${token.slice(-6)}`);

export const describeMinutesRemaining = (minutes) => {
  if (minutes >= 1440) return `${Math.floor(minutes / 1440)} days`;
  if (minutes >= 60) return `${Math.floor(minutes / 60)} hours`;
  return `${minutes} minutes`;
};
