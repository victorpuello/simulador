import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ResultadosDetalladosPage from '../ResultadosDetalladosPage';

vi.mock('../../services/api', () => ({
  simulacionService: {
    getSesion: vi.fn(async () => ({
      id: 1,
      materia: { id: 1, nombre_display: 'Matemáticas' },
      fecha_inicio: new Date().toISOString(),
      fecha_fin: new Date().toISOString(),
      puntuacion: 80,
      preguntas_sesion: [
        {
          id: 1,
          pregunta: {
            id: 10,
            enunciado: '¿2+2?',
            opciones: { A: '3', B: '4', C: '5', D: '6' },
            respuesta_correcta: 'B',
            materia_nombre: 'Matemáticas',
            competencia_nombre: 'Aritmética',
            tiempo_estimado: 30,
            tags: ['sumas']
          },
          respuesta_estudiante: 'B',
          es_correcta: true,
          tiempo_respuesta: 25,
        },
      ],
    })),
  },
}));

describe('ResultadosDetalladosPage', () => {
  it('renderiza resumen por competencias', async () => {
    render(
      <MemoryRouter initialEntries={["/resultados/1"]}>
        <Routes>
          <Route path="/resultados/:sesionId" element={<ResultadosDetalladosPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText('Resumen por competencias')).toBeInTheDocument();
  });
});


