import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
    name: string;
    subDepartments: string[];
    createdAt: Date;
}

const DepartmentSchema = new Schema({
    name: { type: String, required: true },
    subDepartments: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);
