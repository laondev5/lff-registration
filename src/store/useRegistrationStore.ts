import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RegistrationData {
    // Personal Info
    title: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    whatsapp: string;
    gender: 'male' | 'female' | '';

    // Church & Location
    isLFFMember: 'yes' | 'no' | '';
    churchDetails: string;
    areaDistrict: string;
    state: string;
    country: string;

    // Event Preferences
    attendanceType: 'physical' | 'virtual' | '';
    busInterest: 'yes' | 'no' | '';
    mealCollection: string;
    prayerRequest: string;

    // Registration Type
    registrationType: string;
    registrationAmount: string;

    // Accommodation
    needsAccommodation: boolean;
    accommodationType?: string;
    accommodationId?: string;
    duration?: string;

    // Generated
    uniqueId?: string;
}

interface RegistrationStore {
    currentStep: number;
    totalSteps: number;
    data: RegistrationData;
    setStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;
    updateData: (data: Partial<RegistrationData>) => void;
    reset: () => void;
}

const initialData: RegistrationData = {
    title: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    whatsapp: '',
    gender: '',
    isLFFMember: '',
    churchDetails: '',
    areaDistrict: '',
    state: '',
    country: '',
    attendanceType: '',
    busInterest: '',
    mealCollection: '',
    prayerRequest: '',
    registrationType: '',
    registrationAmount: '',
    needsAccommodation: false,
};

export const useRegistrationStore = create<RegistrationStore>()(
    persist(
        (set) => ({
            currentStep: 0,
            totalSteps: 6, // 0: Personal, 1: Church/Location, 2: Preferences, 3: Registration Type, 4: Success/Payment, 5: Accommodation Question
            data: { ...initialData },
            setStep: (step) => set({ currentStep: step }),
            nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, state.totalSteps - 1) })),
            prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),
            updateData: (newData) => set((state) => ({ data: { ...state.data, ...newData } })),
            reset: () => set({
                currentStep: 0,
                data: { ...initialData },
            }),
        }),
        {
            name: 'registration-storage',
        }
    )
);
