import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FoundationCourse } from './FoundationCourse';

test('initial course offers foundational lessons and labels browser-only notes', () => {
  const html = renderToStaticMarkup(<FoundationCourse />);
  assert.match(html, /Первая программа/);
  assert.match(html, /Здоровье и условия/);
  assert.match(html, /Циклы и методы/);
  assert.match(html, /Между устройствами пока не синхронизируются/);
});
