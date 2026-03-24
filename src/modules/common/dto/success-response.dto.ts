import { ApiProperty } from "@nestjs/swagger";
import { ResponseMetaDto } from "./response-meta-dto";




export class SuccessResponseDto {

    @ApiProperty({ example: true })
    ok: boolean;

    @ApiProperty({ example: 'OK' })
    message: string;

    @ApiProperty({
        required: false,
        nullable: true,
        oneOf: [{ type: 'null' }, { type: 'object' }],
    })
    data: unknown | null;

    @ApiProperty({
        nullable: true,
        oneOf: [
            { type: 'null' },
            { type: 'array', items: { type: 'object' } },
        ],
        example: null,
    })
    errors: any[] | null;


   @ApiProperty({ type: () => ResponseMetaDto })
    meta: ResponseMetaDto;
}
