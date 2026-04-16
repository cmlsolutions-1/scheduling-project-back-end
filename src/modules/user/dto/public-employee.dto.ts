import { ApiProperty } from "@nestjs/swagger";

export class PublicEmployeeDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty({ type: [String] })
    serviceIds: string[];

    @ApiProperty({ required: false })
    imageId?: string;

    @ApiProperty({ required: false })
    imageUrl?: string;
}
