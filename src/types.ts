export type UserRole = 'super_admin' | 'admin' | 'sales';
export type UserStatus = 'pending' | 'active' | 'restricted' | 'rejected';

export interface ItineraryItem {
  id: string;
  time: string;
  location: string;
  activity: string;
}

export interface UserProfile {
  uid?: string;
  email: string;
  role: UserRole;
  displayName?: string;
  designation?: string;
  status: UserStatus;
  createdAt?: any;
}

export interface RegistrationRequest {
  id: string;
  email: string;
  name: string;
  requestedRole: UserRole;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
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
