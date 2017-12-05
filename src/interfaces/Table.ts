export default interface Table {
    name : string,
    schema : string | null,
    data : string | null,
    isView : boolean,
}
