const fixture=new URLSearchParams(location.search).get('qa');
if(fixture==='location-success'||fixture==='location-denied'||fixture==='location-outside'){
 Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(ok,fail){setTimeout(()=>{if(fixture==='location-denied')fail({code:1});else ok({coords:fixture==='location-outside'?{latitude:49.2827,longitude:-123.1207,accuracy:80}:{latitude:47.6062,longitude:-122.3321,accuracy:50}});},50);}}});
}
