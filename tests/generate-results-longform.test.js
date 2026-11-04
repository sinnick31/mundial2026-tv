'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSections } = require('../scripts/generate-results-longform');

test('resumen largo explica el resultado sin avisos técnicos sobre datos ausentes', () => {
  const now = Date.now();
  const cache = {
    partidos_recientes: [{
      estado: 'finalizado',
      equipo1: 'Colo-Colo',
      equipo2: 'Coquimbo Unido',
      golesLocal: 2,
      golesVisita: 0,
      competencia: 'Liga de Primera',
      fecha: new Date(now - 60 * 60 * 1000).toISOString(),
      fuente: 'TNT Sports Chile',
      url: 'https://www.tntsports.cl/noticia',
    }],
    partidos_proximos: [{
      equipo1: 'Universidad de Chile',
      equipo2: 'Universidad Católica',
      fecha: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
      competencia: 'Liga de Primera',
      fuente: 'ANFP',
      url: 'https://www.anfp.cl/fixture',
    }],
  };
  const result = buildSections(cache);
  assert.equal(result.recent.length, 1);
  assert.equal(result.upcoming.length, 1);
  assert.match(result.recent[0].cuerpo, /Colo-Colo se quedó con la victoria/);
  assert.doesNotMatch(result.recent[0].cuerpo, /la fuente no entrega|no los inferimos|datos disponibles/i);
  assert.match(result.upcoming[0].cuerpo, /Se juega/);
});

test('deduplica resultados del mismo encuentro y fecha', () => {
  const match = {
    estado: 'finalizado', equipo1: 'Palestino', equipo2: 'Audax Italiano',
    golesLocal: 1, golesVisita: 1, competencia: 'Liga de Primera',
    fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  };
  const result = buildSections({ partidos_recientes: [match, { ...match }], partidos_proximos: [] });
  assert.equal(result.recent.length, 1);
  assert.match(result.recent[0].cuerpo, /empate/i);
});

test('el video largo prioriza la tabla chilena y solo muestra fotos con permiso verificable', () => {
  const now = Date.now();
  const authorized = {
    url:'https://assets.example/player.jpg',
    sourceUrl:'https://club.example/permiso',
    credit:'Club / fotógrafo',
    rights:'authorized',
    authorizationReference:'licencia-123',
    permittedUse:['youtube_monetized'],
    name:'Jugador Destacado',
    team:'Club A',
  };
  const cache = {
    fecha:new Date(now).toISOString(),
    partidos_recientes:[{
      estado:'finalizado', equipo1:'Club A', equipo2:'Club B',
      golesLocal:1, golesVisita:0, competencia:'Liga de Primera',
      fecha:new Date(now-3600000).toISOString(), fuente:'ESPN',
      url:'https://www.espn.com/soccer/match',
    }],
    partidos_proximos:[],
    tabla_fuente:'ESPN',
    tabla_url:'https://www.espn.com/soccer/standings',
    tabla_actualizada:new Date(now).toISOString(),
    tabla_posiciones:[{posicion:1,equipo:'Club A',pj:25,pg:16,pe:5,pp:4,gf:40,gc:20,dif:20,pts:53}],
    jugadores_fuente:'ESPN',
    jugadores_destacados:[{nombre:'Jugador Destacado',equipo:'Club A',categoria:'Goles',valor:'14',fuente:'ESPN'}],
  };
  const result = buildSections(cache, {
    teamImages:{
      'Club A':{...authorized,team:'Club A'},
      'Club B':{url:'https://assets.example/b.png',team:'Club B',rights:'authorized'},
    },
    playerImages:[authorized],
  });
  assert.equal(result.sections[0].tipo,'tabla');
  assert.equal(result.tableSections.length,1);
  assert.equal(result.standings.length,1);
  assert.equal(result.players[0].jugador.imagen,'https://assets.example/player.jpg');
  assert.equal(result.recent[0].escudoLocal,'https://assets.example/player.jpg');
  assert.equal(result.recent[0].escudoVisita,'');
});

test('no acepta fotos de jugadores sin evidencia explícita de licencia para YouTube', () => {
  const cache = {
    partidos_recientes:[], partidos_proximos:[], tabla_posiciones:[],
    jugadores_destacados:[{nombre:'Jugador X',equipo:'Club X',categoria:'Goles',valor:'8'}],
  };
  const result = buildSections(cache, {
    playerImages:[{name:'Jugador X',team:'Club X',url:'https://assets.example/x.jpg',sourceUrl:'https://source.example',credit:'Crédito',rights:'authorized',permittedUse:['youtube']}],
  });
  assert.equal(result.players[0].jugador.imagen,'');
});

test('omite del video largo el partido ya cubierto por un Short del mismo día', () => {
  const history = {items:[{
    tipo_contenido:'noticia',
    hook:'Universidad de Chile y Colo Colo se enfrentan en el clásico',
    titulo:'Universidad de Chile vs Colo Colo: previa del clásico',
    fecha:new Date().toISOString(),
  }]};
  const cache = {
    fecha:new Date().toISOString(),
    partidos_recientes:[{
      estado:'finalizado',equipo1:'Universidad de Chile',equipo2:'Colo Colo',
      golesLocal:2,golesVisita:1,competencia:'Primera División de Chile',
      fecha:new Date().toISOString(),fuente:'ESPN',url:'https://www.espn.com/soccer/match',
    }],
    partidos_proximos:[],
    tabla_posiciones:Array.from({length:8},(_,i)=>({
      posicion:i+1,equipo:'Club '+i,pj:25,pts:50-i,
    })),
    jugadores_destacados:[{
      nombre:'Jugador del Clásico',equipo:'Universidad de Chile',categoria:'Goles',valor:'10',
    }],
  };
  const result = buildSections(cache,{history});
  assert.equal(result.recent.length,0);
  assert.equal(result.sections[0].tipo,'tabla');
});

test('omite del bloque de figuras a un jugador ya cubierto por un Short', () => {
  const history = {items:[{
    tipo_contenido:'noticia',
    hook:'Jugador Destacado firma renovación con Club A',
    titulo:'Jugador Destacado renueva contrato',
    fecha:new Date().toISOString(),
  }]};
  const cache = {
    partidos_recientes:[],partidos_proximos:[],
    tabla_posiciones:Array.from({length:8},(_,i)=>({posicion:i+1,equipo:'Club '+i,pts:30-i})),
    jugadores_destacados:[{nombre:'Jugador Destacado',equipo:'Club A',categoria:'Goles',valor:'14'}],
  };
  const result = buildSections(cache,{history});
  assert.equal(result.players.length,0);
});
