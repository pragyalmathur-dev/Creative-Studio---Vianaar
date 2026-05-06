export type UserRole = 'admin' | 'sales';

export interface UserProfile {
  uid?: string;
  email: string;
  role: UserRole;
  displayName?: string;
  designation?: string;
  status?: 'pending' | 'active';
}

export interface EditableFields {
  name: boolean;
  itinerary: boolean;
  bio: boolean;
}

export interface Template {
  id: string;
  name: string;
  imageUrl: string;
  assignedTo: string[];
  editableFields: EditableFields;
  createdAt: any;
  createdBy: string;
}

export interface EditHistory {
  id: string;
  userId: string;
  userEmail: string;
  templateId: string;
  templateName: string;
  action: 'save' | 'download';
  timestamp: any;
  contentSnapshot: {
    name?: string;
    itinerary?: string;
    bio?: string;
  };
}
