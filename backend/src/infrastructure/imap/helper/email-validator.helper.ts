export function isEmailAllowedForProcessing(from: string, subject: string): boolean {
  // Read from environment variables (comma-separated lists)
  const allowedSendersStr = process.env.ALLOWED_EMAIL_SENDERS || '';
  const allowedSubjectsStr = process.env.ALLOWED_EMAIL_SUBJECTS || '';

  const allowedSenders = allowedSendersStr
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);

  const allowedSubjects = allowedSubjectsStr
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);

  if (allowedSenders.length === 0 && allowedSubjects.length === 0) {
    return true;
  }

  const lowerFrom = from.toLowerCase();
  const lowerSubject = subject.toLowerCase();

  let isSenderAllowed = allowedSenders.length === 0; // If no senders defined, ignore sender check
  let isSubjectAllowed = allowedSubjects.length === 0; // If no subjects defined, ignore subject check

  if (allowedSenders.length > 0) {
    isSenderAllowed = allowedSenders.some((allowedSender) => lowerFrom.includes(allowedSender));
  }

  if (allowedSubjects.length > 0) {
    isSubjectAllowed = allowedSubjects.some((allowedSubj) => lowerSubject.includes(allowedSubj));
  }

  return isSenderAllowed || isSubjectAllowed;
}
