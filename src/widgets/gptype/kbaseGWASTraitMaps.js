(function( $, undefined ) {
    $.KBWidget({
        name: "KBaseGWASTraitMaps",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            color: "black",
            width: 1200
        },

        init: function(options) {
            this._super(options);

            var self = this;

            var $mapDiv = $('<div/>')
            .addClass('gmap3')
            .attr({ id: 'mapElement'});
            self.$elem.append($mapDiv);

            return this.render();
        },
        render: function(options) {

            
            $('#mapElement').width('1100px').height('450px').gmap3({
              map:{
                options:{
                  center:[46.578498,2.457275],
                  zoom: 2 
                }
              },
              marker:{
                values:[
                {latLng:[50.9167, 9.57073], data:"7000:Aa-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[45.0, 1.3], data:"6897:Ag-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[40.31, -3.22], data:"6988:Alc-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[56.68, 16.5], data:"8230:Algutsrum",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[51.2167, 4.4], data:"6898:An-1",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[50.3, 5.3], data:"8254:Ang-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[56.5459, -4.79821], data:"7014:Ba-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[56.4, 12.9], data:"8256:BÃÂ¥1-2",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[56.4, 12.9], data:"8258:BÃÂ¥4-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[56.4, 12.9], data:"8259:BÃÂ¥5-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[49.0, 11.0], data:"6899:Bay-0",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[47.6479, -122.305], data:"6709:Bg-2",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[63.324, 18.484], data:"6900:Bil-5",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[63.324, 18.484], data:"6901:Bil-7",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[41.6833, 2.8], data:"8264:Bla-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[48.0, 19.0], data:"8265:Blh-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[55.86, 13.51], data:"8266:Boo2-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[49.4013, 16.2326], data:"5837:Bor-1",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[49.4013, 16.2326], data:"6903:Bor-4",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[49.2, 16.6166], data:"6904:Br-0",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[56.3, 16.0], data:"8231:BrÃÂ¶1-6",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[47.5, 7.5], data:"8270:Bs-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[50.5, 9.5], data:"8271:Bu-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[41.3599, -122.755], data:"7033:Buckhorn Pass",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[54.1, -6.2], data:"6905:Bur-0",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[40.2077, -8.42639], data:"6906:C24",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[50.2981, 8.26607], data:"7062:Ca-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[29.2144, -13.4811], data:"8274:Can-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[49.0, 0.5], data:"8275:Cen-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[51.4083, -0.6383], data:"6907:CIBC-17",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[51.4083, -0.6383], data:"6908:CIBC-5",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[51.3, 1.1], data:"7064:Cnt-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[40.2077, -8.42639], data:"7081:Co",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[38.3, -92.3], data:"6909:Col-0",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[37.3, 15.0], data:"6910:Ct-1",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[15.1111, -23.6167], data:"6911:Cvi-0",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[, ], data:"7460:Da(1)-12",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[49.8724, 8.65081], data:"7094:Da-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[41.1876, -87.1923], data:"8233:Dem-4",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[55.76, 14.12], data:"8283:Dra3-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[49.4112, 16.2815], data:"8284:DraII-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[49.4112, 16.2815], data:"8285:DraIII-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[49.1, 16.2], data:"6008:Duk",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[62.877, 18.177], data:"6009:Eden-1",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[62.877, 18.177], data:"6913:Eden-2",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[55.949444, -3.160278], data:"6914:Edi-0",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[62.9, 18.4], data:"6016:Eds-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[50.3, 6.3], data:"6915:Ei-2",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[50.0, 8.5], data:"8290:En-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[50.1721, 8.38912], data:"7123:Ep-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[58.3, 25.3], data:"6916:Est-1",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[63.0165, 18.3174], data:"6917:FÃÂ¤b-2",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[63.0165, 18.3174], data:"6918:FÃÂ¤b-4",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[40.5, -8.32], data:"8215:Fei-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[56.06, 14.29], data:"8422:FjÃÂ¤1-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[50.3, 8.0], data:"6919:Ga-0",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[53.5, 10.5], data:"8296:Gd-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[46.5, 6.08], data:"8297:Ge-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[50.584, 8.67825], data:"7147:Gie-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[51.5338, 9.9355], data:"6920:Got-22",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[51.5338, 9.9355], data:"6921:Got-7",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[47.0, 15.5], data:"8300:Gr-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[50.3, 8.0], data:"6922:Gu-0",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[49.0, 2.0], data:"8214:Gy-0",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[49.0, 15.0], data:"7461:H55",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[52.3721, 9.73569], data:"7163:Ha-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[48.8, 17.1], data:"8235:Hod",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[56.1, 13.74], data:"8423:Hov2-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[56.1, 13.74], data:"8306:Hov4-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[51.4083, -0.6383], data:"6923:HR-10",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[51.4083, -0.6383], data:"6924:HR-5",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[52.24, 9.44], data:"8310:Hs-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[49.33, 15.76], data:"8236:HSm",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[47.5, 11.5], data:"8311:In-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[50.5, 7.5], data:"8312:Is-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[49.2, 16.6166], data:"7424:Jl-3",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[49.0, 15.0], data:"8313:Jm-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[47.0, 14.0], data:"8314:Ka-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[35.0, 77.0], data:"8424:Kas-2",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[55.8, 13.1], data:"8237:KÃÂ¤vlinge-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[50.0667, 8.5333], data:"8420:Kelsterbach-4",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[44.46, -85.37], data:"6926:Kin-0",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[55.66, 13.4], data:"6040:Kni-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[41.2816, -86.621], data:"6927:Kno-10",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[41.2816, -86.621], data:"6928:Kno-18",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[51.0, 7.0], data:"8239:KÃÂ¶ln",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[38.48, 68.49], data:"6929:Kondara",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[55.705, 13.196], data:"8240:Kulturen-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[49.5, 73.1], data:"6930:Kz-1",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[49.5, 73.1], data:"6931:Kz-9",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[57.0, -4.0], data:"8323:Lc-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[47.984, 10.8719], data:"6932:Ler-1",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[50.3833, 8.0666], data:"7231:Li-7",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[55.9473, 13.821], data:"8241:Liarum",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[56.1494, 15.7884], data:"8242:LillÃÂ¶-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[50.0, 19.3], data:"8325:Lip-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[56.0328, 14.775], data:"8326:Lis-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[56.0328, 14.775], data:"8222:Lis-2",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[52.25, 4.5667], data:"8430:Lisse",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[41.59, 2.49], data:"6933:LL-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[48.0, 0.5], data:"8329:Lm-2",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[56.09, 13.9], data:"6042:Lom1-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[62.801, 18.079], data:"6043:LÃÂ¶v-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[62.801, 18.079], data:"6046:LÃÂ¶v-5",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[49.38, 16.81], data:"7520:Lp2-2",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[49.38, 16.81], data:"7521:Lp2-6",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[55.71, 13.2], data:"8334:Lu-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[55.71, 13.2], data:"8335:Lund",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[46.0, 3.3], data:"6936:Lz-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[50.95, 7.5], data:"7255:Mh-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[44.0, 12.37], data:"8337:Mir-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[44.15, 9.65], data:"7522:Mr-0",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[49.0, 9.3], data:"6937:Mrk-0",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[32.34, 22.46], data:"6939:Mt-0",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[50.3, 8.3], data:"6940:Mz-0",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[61.36, 34.15], data:"7438:N13",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[47.5, 1.5], data:"8343:Na-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[50.0, 10.0], data:"6942:Nd-1",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[51.4083, -0.6383], data:"6943:NFA-10",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[51.4083, -0.6383], data:"6944:NFA-8",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[51.0581, 13.2995], data:"7275:No-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[52.24, 4.45], data:"6945:Nok-3",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[62.9513, 18.2763], data:"6064:Nyl-2",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[56.1509, 15.7735], data:"7518:ÃÂMÃÂ¶2-1",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[56.1509, 15.7735], data:"7519:ÃÂMÃÂ¶2-3",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[50.3827, 8.01161], data:"7282:Or-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[56.4573, 16.1408], data:"6074:ÃÂr-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[60.25, 18.37], data:"8351:Ost-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[60.23, 6.13], data:"6946:Oy-0",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[38.07, 13.22], data:"8353:Pa-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[58.0, 56.3167], data:"8354:Per-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[59.0, 29.0], data:"7296:Petergof",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[43.7703, 11.2547], data:"8243:PHW-2",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[41.5, 2.25], data:"8357:Pla-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[42.0945, -86.3253], data:"7526:Pna-10",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[42.0945, -86.3253], data:"7523:Pna-17",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[49.2655, -123.206], data:"7306:Pog-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[43.25, -6.0], data:"8213:Pro-0",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[49.42, 16.36], data:"6951:Pu2-23",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[49.42, 16.36], data:"6956:Pu2-7",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[49.42, 16.36], data:"6957:Pu2-8",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[46.0, 3.3], data:"6958:Ra-0",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[49.0, 16.0], data:"8365:Rak-2",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[50.5, 8.5], data:"8411:Rd-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[50.5, 8.5], data:"8366:Rd-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[48.5, -1.41], data:"6959:Ren-1",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[48.5, -1.41], data:"6960:Ren-11",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[55.6942, 13.4504], data:"8369:Rev-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[42.036, -86.511], data:"7524:Rmx-A02",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[42.036, -86.511], data:"7525:Rmx-A180",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[41.5609, -86.4251], data:"7515:RRS-10",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[41.5609, -86.4251], data:"7514:RRS-7",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[56.3, 34.0], data:"8374:Rsch-4",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[49.0, 38.28], data:"7323:Rubezhnoe-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[56.07, 13.74], data:"8247:San-2",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[62.69, 18.0], data:"8376:Sanna-2",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[49.49, 14.24], data:"8378:Sap-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[49.1833, 15.8833], data:"8412:Sav-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[38.3333, -3.53333], data:"6961:Se-0",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[47.0, -122.2], data:"8245:Seattle-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[38.35, 68.48], data:"6962:Shahdara",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[38.35, 68.48], data:"6963:Sorbo",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[56.3, 16.0], data:"6964:Spr1-2",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[58.4173, 14.1576], data:"6965:Spr1-6",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[51.4083, -0.6383], data:"6966:Sq-1",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[51.4083, -0.6383], data:"6967:Sq-8",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[59.0, 18.0], data:"8387:St-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[52.6058, 11.8558], data:"7346:Ste-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[52.0, 36.0], data:"8388:Stw-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[49.5, 14.5], data:"8389:Ta-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[60.0, 23.5], data:"6968:Tamm-2",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[60.0, 23.5], data:"6969:Tamm-27",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[55.95, 13.85], data:"6243:Tottarp-2",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[41.7194, 2.93056], data:"6970:Ts-1",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[41.7194, 2.93056], data:"6971:Ts-5",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[34.43, 136.31], data:"6972:Tsu-1",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[45.0, 7.5], data:"8395:Tu-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[56.06, 13.97], data:"8426:Ull1-1",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[56.0648, 13.9707], data:"6973:Ull2-3",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[56.0648, 13.9707], data:"6974:Ull2-5",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[48.3, 14.45], data:"6975:Uod-1",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[48.3, 14.45], data:"6976:Uod-7",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[49.3, -123.0], data:"6977:Van-0",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[55.58, 14.334], data:"7516:VÃÂ¥r2-1",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[55.58, 14.334], data:"7517:VÃÂ¥r2-6",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[57.75, 16.6333], data:"9058:VÃÂ¤stervik",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[57.7, 15.8], data:"8249:Vimmerby",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[56.1, 13.9167], data:"9057:VinslÃÂ¶v",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[52.3, 21.0], data:"6978:Wa-1",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[41.7302, -71.2825], data:"7477:WAR",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[47.25, 8.26], data:"6979:Wei-0",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[, ], data:"100000:Wil-1-Dean-Lab",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[52.3, 30.0], data:"6980:Ws-0",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[52.3, 30.0], data:"6981:Ws-2",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[52.3, 9.3], data:"6982:Wt-5",options:{icon: "/landing-pages/assets/images/NA.svg"} },
                {latLng:[37.45, -119.35], data:"6983:Yo-0",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[49.3853, 16.2544], data:"6984:Zdr-1",options:{icon: "/landing-pages/assets/images/1.0.svg"} },
                {latLng:[49.3853, 16.2544], data:"6985:Zdr-6",options:{icon: "/landing-pages/assets/images/0.0.svg"} },
                {latLng:[47.3667, 8.55], data:"7418:Zu-1",options:{icon: "/landing-pages/assets/images/NA.svg"} }
                ],
                options:{
                  draggable: false
                },
                events:{
                  mouseover: function(marker, event, context){
                    var map = $(this).gmap3("get"),
                      infowindow = $(this).gmap3({get:{name:"infowindow"}});
                    if (infowindow){
                      infowindow.open(map, marker);
                      infowindow.setContent(context.data);
                    } else {
                      $(this).gmap3({
                        infowindow:{
                          anchor:marker, 
                          options:{content: context.data}
                        }
                      });
                    }
                  },
                  mouseout: function(){
                    var infowindow = $(this).gmap3({get:{name:"infowindow"}});
                    if (infowindow){
                      infowindow.close();
                    }
                  }
                }
              }
            });


            return this;
        },
        getData: function() {
            return {
                type:"GwasPopulation",
                id: this.options.objId,
                gwaspopulationId: this.options.gwaspopulationId,
                workspace: this.options.workspaceID,
                title: "GWAS Population Trait Distribution"
            };
        }
    });
})( jQuery )
