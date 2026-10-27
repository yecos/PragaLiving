import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolveLocationLayers, locationLayers, OPTIKALEJANDRIA, poiMeta } from '../src/components/praga/locationData.ts'

const businessPoints = layers => layers.flatMap(layer => layer.points).filter(p => p.name === OPTIKALEJANDRIA.name)

for (const [name, config] of [['absent', undefined], ['null', null], ['empty', []], ['defaults', locationLayers]]) {
  test(`business appears once with ${name} config`, () => {
    const result = resolveLocationLayers(config)
    assert.deepEqual(businessPoints(result), [OPTIKALEJANDRIA])
    assert.deepEqual(result.find(l => l.id === 'comercio').points[0], OPTIKALEJANDRIA)
  })
}

test('old CMS preserves custom points and layers, adds business without mutating input', () => {
  const config = [{ id: 'comercio', name: 'Tiendas', icon: '□', color: '#123456', points: [{ name: 'Tienda CMS', description: 'Custom', lat: 6, lng: -75 }] }]
  const snapshot = structuredClone(config)
  const result = resolveLocationLayers(config)
  assert.deepEqual(config, snapshot)
  assert.equal(result[0].name, 'Tiendas')
  assert.deepEqual(result[0].points[0], OPTIKALEJANDRIA)
  assert.deepEqual(result[0].points[1], config[0].points[0])
  assert.deepEqual(businessPoints(result), [OPTIKALEJANDRIA])
})

test('CMS without commerce gets a commerce layer', () => {
  const config = [{ id: 'salud', name: 'Salud', icon: '○', color: '#123456', points: [] }]
  const result = resolveLocationLayers(config)
  assert.deepEqual(result[0], config[0])
  assert.deepEqual(result[1].points, [OPTIKALEJANDRIA])
})

test('stale and duplicated CMS business entries use verified coordinates and omit unverified estimates', () => {
  const stale = { ...OPTIKALEJANDRIA, name: 'Optikalejandria SAS', lat: 0, lng: 0, distance: '10m', time: '1 min' }
  const config = [{ id: 'comercio', name: 'Comercio', icon: '□', color: '#123456', points: [stale, stale] }]
  assert.deepEqual(resolveLocationLayers(config)[0].points, [OPTIKALEJANDRIA])
  assert.equal(poiMeta(OPTIKALEJANDRIA), '')
})

test('metadata supports missing values without separators or invented travel modes', () => {
  assert.equal(poiMeta({ ...OPTIKALEJANDRIA, distance: '200m' }), '200m')
  assert.equal(poiMeta({ ...OPTIKALEJANDRIA, time: '25 min en vehículo' }), '25 min en vehículo')
  assert.equal(poiMeta({ ...OPTIKALEJANDRIA, distance: '200m', time: '3 min' }), '200m · 3 min')
})

test('shipped CMS config and fallback resolve to the same business', () => {
  const config = JSON.parse(readFileSync(new URL('../src/data/site-config.json', import.meta.url)))
  assert.deepEqual(businessPoints(resolveLocationLayers(config.ubicacion.layers)), [OPTIKALEJANDRIA])
})
