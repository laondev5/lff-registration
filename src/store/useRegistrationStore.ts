import { create } from 'zustand';

export interface RegistrationData {
    // Personal Info
    fullName: string;
    email: string;
    phone: string;

    // Participation Details
    isVolunteer: boolean;
    department?: string;

    // Accommodation
    needsAccommodation: boolean;
    accommodationType?: string;
    accommodationId?: string;
    duration?: string;
}

interface RegistrationStore {
    currentStep: number;
    data: RegistrationData;
    setStep: (step: number) => void;
    updateData: (data: Partial<RegistrationData>) => void;
    reset: () => void;
}

export const useRegistrationStore = create<RegistrationStore>((set) => ({
    currentStep: 0,
    data: {
        fullName: '',
        email: '',
        phone: '',
        isVolunteer: false,
        needsAccommodation: false,
    },
    setStep: (step) => set({ currentStep: step }),
    updateData: (newData) => set((state) => ({ data: { ...state.data, ...newData } })),
    reset: () => set({
        currentStep: 0,
        data: {
            fullName: '',
            email: '',
            phone: '',
            isVolunteer: false,
            needsAccommodation: false,
        }
    }),
}));
