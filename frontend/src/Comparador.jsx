import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, ProgressBar } from 'react-bootstrap';
import { FaBalanceScale, FaChartLine } from 'react-icons/fa';

const SelectCenario = ({ titulo, valor, setValor, listaCidades }) => {
    const anos = Array.from({length: 11}, (_, i) => 2025 - i);
    
    const handleChange = (campo, v) => {
        setValor(prev => ({ ...prev, [campo]: v }));
    };

    return (
        <Card className="h-100 shadow-sm border-0">
            <Card.Header className="bg-white fw-bold text-primary border-bottom-0 pt-3">
                {titulo}
            </Card.Header>
            <Card.Body>
                <Form.Group className="mb-2">
                    <Form.Label className="small text-muted">Município</Form.Label>
                    <Form.Select 
                        value={valor.municipio} 
                        onChange={e => handleChange('municipio', e.target.value)}
                        className="fw-bold"
                    >
                        <option value="">Selecione...</option>
                        {listaCidades.map(c => <option key={c} value={c}>{c}</option>)}
                    </Form.Select>
                </Form.Group>
                <Row>
                    <Col>
                        <Form.Label className="small text-muted">Ano</Form.Label>
                        <Form.Select value={valor.ano} onChange={e => handleChange('ano', Number(e.target.value))}>
                            {anos.map(a => <option key={a} value={a}>{a}</option>)}
                        </Form.Select>
                    </Col>
                    <Col>
                        <Form.Label className="small text-muted">Mês</Form.Label>
                        <Form.Select value={valor.mes} onChange={e => handleChange('mes', Number(e.target.value))}>
                            <option value={0}>Ano Todo</option>
                            {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                        </Form.Select>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};

const CardStat = ({ label, valA, valB, colorClass }) => {
    const total = (valA + valB) || 1;
    const pctA = (valA / total) * 100;
    
    return (
        <div className="mb-4">
            <div className="d-flex justify-content-between mb-1">
                <span className={`fw-bold text-${colorClass}`}>{valA.toLocaleString()}</span>
                <small className="text-muted fw-bold text-uppercase">{label}</small>
                <span className={`fw-bold text-${colorClass}`}>{valB.toLocaleString()}</span>
            </div>
            <ProgressBar style={{height: '10px'}}>
                <ProgressBar variant={colorClass} now={pctA} key={1} />
                <ProgressBar variant="secondary" now={100 - pctA} key={2} style={{opacity: 0.3}} />
            </ProgressBar>
        </div>
    );
};

export default function Comparador({ listaCidades }) {
    const [cenarioA, setCenarioA] = useState({ municipio: 'RECIFE', ano: 2024, mes: 0 });
    const [cenarioB, setCenarioB] = useState({ municipio: 'CARUARU', ano: 2024, mes: 0 });
    const [dados, setDados] = useState(null);
    const [loading, setLoading] = useState(false);

    const comparar = async () => {
        if (!cenarioA.municipio || !cenarioB.municipio) return;
        setLoading(true);
        try {
            // URL do seu backend
            const response = await fetch('http://172.16.212.11:5000/api/comparar', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cenarioA, cenarioB })
            });
            const data = await response.json();
            setDados(data);
        } catch (error) {
            console.error(error);
            alert("Erro ao comparar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="fade-in-down pb-5">
            <div className="text-center mb-4 mt-3">
                <h3 className="fw-bold text-secondary"><FaBalanceScale className="me-2"/>Comparador de Cenários</h3>
                <p className="text-muted">Analise diferenças entre locais e datas distintas.</p>
            </div>

            <Row className="g-3 mb-4">
                <Col md={5}>
                    <SelectCenario titulo="Cenário A (Esquerda)" valor={cenarioA} setValor={setCenarioA} listaCidades={listaCidades} />
                </Col>
                <Col md={2} className="d-flex align-items-center justify-content-center">
                    <Button variant="primary" size="lg" className="rounded-circle p-3 shadow" onClick={comparar} disabled={loading}>
                        {loading ? '...' : 'VS'}
                    </Button>
                </Col>
                <Col md={5}>
                    <SelectCenario titulo="Cenário B (Direita)" valor={cenarioB} setValor={setCenarioB} listaCidades={listaCidades} />
                </Col>
            </Row>

            {dados && (
                <Card className="border-0 shadow fade-in-up">
                    <Card.Body className="p-4">
                        <Row className="text-center mb-4">
                            <Col xs={6} className="border-end">
                                <h5 className="text-primary fw-bold mb-0">{dados.cenarioA.municipio}</h5>
                                <small className="text-muted">{dados.cenarioA.mes === 0 ? 'Ano' : 'Mês ' + dados.cenarioA.mes}/{dados.cenarioA.ano}</small>
                            </Col>
                            <Col xs={6}>
                                <h5 className="text-primary fw-bold mb-0">{dados.cenarioB.municipio}</h5>
                                <small className="text-muted">{dados.cenarioB.mes === 0 ? 'Ano' : 'Mês ' + dados.cenarioB.mes}/{dados.cenarioB.ano}</small>
                            </Col>
                        </Row>

                        <hr className="my-4"/>

                        <CardStat label="População" valA={dados.cenarioA.populacao} valB={dados.cenarioB.populacao} colorClass="info" />
                        <CardStat label="Violência Doméstica (Absoluto)" valA={dados.cenarioA.violencia} valB={dados.cenarioB.violencia} colorClass="danger" />
                        <CardStat label="Estupro (Absoluto)" valA={dados.cenarioA.estupro} valB={dados.cenarioB.estupro} colorClass="dark" />
                        
                        <div className="row mt-5">
                            <Col className="text-center">
                                <h6 className="text-muted small fw-bold">TAXA VIOLÊNCIA (por 100k)</h6>
                                <div className="d-flex justify-content-around align-items-end">
                                    <div className="display-6 text-danger fw-bold">{dados.cenarioA.taxa_violencia}</div>
                                    <div className="display-6 text-danger fw-bold">{dados.cenarioB.taxa_violencia}</div>
                                </div>
                            </Col>
                        </div>
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
}