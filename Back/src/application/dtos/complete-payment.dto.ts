import { IsString, IsInt, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompletePaymentDto {
  @ApiProperty({ description: 'Payment gateway card token' })
  @IsString()
  @IsNotEmpty()
  cardToken: string;

  @ApiProperty({ description: 'Number of installments', minimum: 1 })
  @IsInt()
  @Min(1)
  installments: number;

  @ApiProperty({ description: 'Payment gateway acceptance token' })
  @IsString()
  @IsNotEmpty()
  acceptanceToken: string;

  @ApiProperty({ description: 'Payment gateway personal data auth token' })
  @IsString()
  @IsNotEmpty()
  acceptPersonalAuth: string;
}
