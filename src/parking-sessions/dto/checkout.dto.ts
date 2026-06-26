import { IsDate, IsNotEmpty } from "class-validator";

export class CheckoutDto{
    @IsNotEmpty()
    @IsDate()
    checkoutTime: Date;

    checkOutImage?: string;
}
