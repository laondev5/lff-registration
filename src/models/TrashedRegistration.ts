import mongoose, { Schema, Document } from 'mongoose';

export interface ITrashedRegistration extends Document {
  // All original registration fields
  uniqueId: string;
  title: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  whatsapp: string;
  gender: string;
  isLFFMember: string;
  churchDetails: string;
  areaDistrict: string;
  state: string;
  country: string;
  attendanceType: string;
  busInterest: string;
  mealCollection: string;
  prayerRequest: string;
  registrationType: string;
  registrationAmount: string;
  registrationPaymentProof: string;
  needsAccommodation: string;
  accommodationType: string;
  price: string;
  duration: string;
  paymentProof: string;
  departmentStatus: string;
  department: string;
  subDepartment: string;
  registrationStatus: string;
  paymentReference: string;
  sheetId?: string;
  createdAt: Date;
  // Trash metadata
  trashedAt: Date;
  trashedFrom: string; // 'users' | 'paystack-payments'
  reRegisterEmailSent: boolean;
}

const TrashedRegistrationSchema = new Schema({
  uniqueId: { type: String, required: true, unique: true },
  title: { type: String, default: '' },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, default: '' },
  whatsapp: { type: String, default: '' },
  gender: { type: String, default: '' },
  isLFFMember: { type: String, default: '' },
  churchDetails: { type: String, default: '' },
  areaDistrict: { type: String, default: '' },
  state: { type: String, default: '' },
  country: { type: String, default: '' },
  attendanceType: { type: String, default: '' },
  busInterest: { type: String, default: '' },
  mealCollection: { type: String, default: '' },
  prayerRequest: { type: String, default: '' },
  registrationType: { type: String, default: '' },
  registrationAmount: { type: String, default: '' },
  registrationPaymentProof: { type: String, default: '' },
  needsAccommodation: { type: String, default: 'No' },
  accommodationType: { type: String, default: '' },
  price: { type: String, default: '' },
  duration: { type: String, default: '' },
  paymentProof: { type: String, default: '' },
  departmentStatus: { type: String, default: '' },
  department: { type: String, default: '' },
  subDepartment: { type: String, default: '' },
  registrationStatus: { type: String, default: 'Pending' },
  paymentReference: { type: String, default: '' },
  sheetId: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  // Trash metadata
  trashedAt: { type: Date, default: Date.now },
  trashedFrom: { type: String, default: 'users' },
  reRegisterEmailSent: { type: Boolean, default: false },
});

export default mongoose.models.TrashedRegistration ||
  mongoose.model<ITrashedRegistration>('TrashedRegistration', TrashedRegistrationSchema);
