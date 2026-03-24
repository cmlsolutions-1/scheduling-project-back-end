import { ApiProperty } from "@nestjs/swagger";
import { PaginationMetaDto } from "./pagination-meta.dto";


export class PaginatedDto<T> {
    // En swagger lo “rellenamos” con el modelo real usando un decorador (igual que wrapped)
    items: T[];

    @ApiProperty({ type: PaginationMetaDto })
    pagination: PaginationMetaDto;
}