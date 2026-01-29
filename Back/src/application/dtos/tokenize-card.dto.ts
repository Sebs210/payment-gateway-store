import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TokenizeCardDto {
  @ApiProperty({ description: 'Card number' })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiProperty({ description: 'CVC code' })
  @IsString()
  @Length(3, 4)
  cvc: string;

  @ApiProperty({ description: 'Expiration month (MM)' })
  @IsString()
  @Length(2, 2)
  expMonth: string;

  @ApiProperty({ description: 'Expiration year (YY)' })
  @IsString()
  @Length(2, 2)
  expYear: string;

  @ApiProperty({ description: 'Card holder name' })
  @IsString()
  @IsNotEmpty()
  cardHolder: string;
}
