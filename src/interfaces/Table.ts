export interface Column {
    [k : string] : {
        type : string
        nullable : boolean
    }
}

export interface Table {
    name : string,
    schema : string | null,
    data : string | null,
    columns : Column,
    isView : boolean,
}

export default Table
