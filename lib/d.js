const _D_ = function(s){
  this.d = null

  const _s = String(s)
  if(_s.length === 10 || _s.length === 8){
    const Y = parseInt(_s.slice(0, 4))
    const M = parseInt(_s.slice(4, 6)) - 1
    const D = parseInt(_s.slice(6, 8))
    const H = _s.length === 10 ? parseInt(_s.slice(8, 10)) : 0

    this.d = new Date(Date.UTC(Y, M, D, H))
  }
  else
    this.d = new Date()


  this._ = function(h){
    const TS = this.d.getTime() + ( h * 3600000 )

    return {...this, d: new Date(TS)}
  }

  this.ymd = function(){
    return (
      String(this.d.getUTCFullYear() )
      + String(this.d.getUTCMonth() + 1).padStart(2, '0')
      + String(this.d.getUTCDate()).padStart(2, '0')
    )
  }

  this.h = function(){
    return String(this.d.getUTCHours()).padStart(2, '0')
  }

  this.ymdh = function(){
    return this.ymd() + this.h()
  }

  this.set = function(h){
    const closure = this.d
    closure.setUTCHours(h)

    return {...this, d: closure}
  }
}

module.exports = _D_
