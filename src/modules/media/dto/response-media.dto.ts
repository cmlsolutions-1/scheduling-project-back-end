import { ApiProperty } from "@nestjs/swagger";
import { MediaKind } from "../entity/media.entity";

export class ResponseMediaDto {
    @ApiProperty()
    id: string;

    @ApiProperty({ enum: MediaKind })
    kind: MediaKind;

    @ApiProperty()
    originalName: string;

    @ApiProperty()
    fileName: string;

    @ApiProperty()
    mimeType: string;

    @ApiProperty()
    size: number;

    @ApiProperty()
    url: string;

    @ApiProperty()
    companyId: string;
}
