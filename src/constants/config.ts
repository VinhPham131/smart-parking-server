export enum ParkingSlotStatus {
    AVAILABLE = 'Available',
    OCCUPIED = 'Occupied',
    RESERVED = 'Reserved',
    MAINTENANCE = 'Maintenance',
}

export enum ParkingSessionStatus {
    IN_PROGRESS = 'In Progress',
    COMPLETED = 'Completed',
}

export enum ProcessParkingType {
    CHECKIN = 'checkin',
    CHECKOUT = 'checkout',
}

export enum PaymentMethod {
    WALLET = 'Wallet',
    MEMBERSHIP = 'Membership',
}

export enum DateTimeFormat {
    DATE = 'DATE',
    DATE_TIME = 'DATE_TIME',
    TIME = 'TIME',
}

export enum RfidType {
    REGULAR = 'regular',
    MEMBER = 'member',
}

export enum ReservationStatus {
    PENDING = 'Pending',
    APPROVED = 'Approved',
    REJECTED = 'Rejected',
}

export enum ParkingStatus {
    CHECKED_IN = 'Checked In',
    CANCELLED = 'Cancelled',
    PENDING = 'Pending',
}

export enum UserRole {
    USER = 'user',
    ADMIN = 'admin',
}

export enum Range {
    TODAY = 'today',
    THIS_WEEK = 'this week',
    THIS_MONTH = 'this month',
}

export enum PaymentStatus {
    PENDING = 'Pending',
    SUCCESS = 'Success',
    FAILED = 'Failed',
}

export enum PaymentType {
   SUBSCRIPTION = 'Subscription',
   PARKING_FEE = 'Parking Fee',
   DEPOSIT = 'Deposit',
   REFUND = 'Refund',
}

export enum RfidRequestStatus {
    PENDING = 'Pending',
    APPROVED = 'Approved',
    REJECTED = 'Rejected',
}