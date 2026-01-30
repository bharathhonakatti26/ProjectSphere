import { Badge } from '@mantine/core';

const statusConfig = {
  // Project statuses
  PLANNING: { color: 'gray', label: 'Planning' },
  IN_PROGRESS: { color: 'blue', label: 'In Progress' },
  REVIEW: { color: 'yellow', label: 'Under Review' },
  COMPLETED: { color: 'green', label: 'Completed' },
  ARCHIVED: { color: 'dark', label: 'Archived' },

  // Team statuses
  ACTIVE: { color: 'green', label: 'Active' },
  INACTIVE: { color: 'gray', label: 'Inactive' },
  PENDING: { color: 'yellow', label: 'Pending' },

  // Submission statuses
  NOT_SUBMITTED: { color: 'gray', label: 'Not Submitted' },
  SUBMITTED: { color: 'blue', label: 'Submitted' },
  GRADED: { color: 'green', label: 'Graded' },
  LATE: { color: 'red', label: 'Late' },

  // Membership statuses
  APPROVED: { color: 'green', label: 'Approved' },
  REJECTED: { color: 'red', label: 'Rejected' },

  // User roles
  STUDENT: { color: 'cyan', label: 'Student' },
  TEACHER: { color: 'violet', label: 'Teacher' },

  // Chat types
  CLASSROOM_CHAT: { color: 'violet', label: 'Classroom' },
  TEAM_REVIEW_CHAT: { color: 'blue', label: 'Team Review' },
  TEAM_INTERNAL_CHAT: { color: 'cyan', label: 'Internal' },
  DIRECT_MESSAGE: { color: 'green', label: 'Direct' },

  // Project types
  STUDENT_INITIATED: { color: 'cyan', label: 'Student Initiated' },
  TEACHER_INITIATED: { color: 'violet', label: 'Teacher Initiated' },
  CLASSROOM_MINI_PROJECT: { color: 'grape', label: 'Mini Project' },

  // Evaluation
  LOCKED: { color: 'red', label: 'Locked' },
  UNLOCKED: { color: 'green', label: 'Open' },
};

const StatusBadge = ({ status, size = 'sm', variant = 'light', ...props }) => {
  const config = statusConfig[status] || { color: 'gray', label: status };

  return (
    <Badge
      size={size}
      variant={variant}
      color={config.color}
      radius="sm"
      {...props}
    >
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
