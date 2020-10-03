// Replace with Spaceship map to copy when available
String.prototype.formatted = function() {
    return this.replace(/_/g, " ").replace(/(^\w|\s\w)(\S*)/g, (_,m1,m2) => m1.toUpperCase()+m2.toLowerCase())
}
