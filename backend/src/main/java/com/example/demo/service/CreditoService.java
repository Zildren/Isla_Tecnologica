package com.example.demo.service;

import com.example.demo.dto.CreditoDTO.*;
import com.example.demo.model.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CreditoService {
    private final ClienteRepository clienteRepository;
    private final AbonoRepository abonoRepository;
    private final EmpresaRepository empresaRepository;

    public List<ClienteResponse> listarClientes(Long empresaId) {
        return clienteRepository.findAllByEmpresaId(empresaId)
                .stream().map(this::toClienteResponse).collect(Collectors.toList());
    }

    @Transactional
    public ClienteResponse crearCliente(ClienteRequest req, Long empresaId, String matricula) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Empresa no encontrada"));
        Cliente cliente = Cliente.builder()
                .nombre(req.getNombre()).telefono(req.getTelefono())
                .descripcion(req.getDescripcion()).montoTotal(req.getMontoTotal())
                .saldoPendiente(req.getMontoTotal()).fechaInicio(LocalDate.now())
                .registradoPor(matricula).empresa(empresa).build();
        return toClienteResponse(clienteRepository.save(cliente));
    }

    @Transactional
    public void eliminarCliente(Long clienteId, Long empresaId) {
        Cliente cliente = clienteRepository.findByIdAndEmpresaId(clienteId, empresaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado"));
        clienteRepository.delete(cliente);
    }

    @Transactional
    public AbonoResponse registrarAbono(Long clienteId, AbonoRequest req, Long empresaId, String matricula) {
        Cliente cliente = clienteRepository.findByIdAndEmpresaId(clienteId, empresaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado"));
        if (req.getMonto().compareTo(cliente.getSaldoPendiente()) > 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El abono supera el saldo pendiente");
        cliente.setSaldoPendiente(cliente.getSaldoPendiente().subtract(req.getMonto()));
        clienteRepository.save(cliente);
        Abono abono = Abono.builder().monto(req.getMonto()).nota(req.getNota())
                .fecha(LocalDate.now()).hora(LocalTime.now())
                .registradoPor(matricula).cliente(cliente).build();
        return toAbonoResponse(abonoRepository.save(abono));
    }

    @Transactional
    public void eliminarAbono(Long abonoId, Long empresaId) {
        Abono abono = abonoRepository.findByIdAndClienteEmpresaId(abonoId, empresaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Abono no encontrado"));
        Cliente cliente = abono.getCliente();
        cliente.setSaldoPendiente(cliente.getSaldoPendiente().add(abono.getMonto()));
        clienteRepository.save(cliente);
        abonoRepository.delete(abono);
    }

    public List<AbonoResponse> listarAbonos(Long clienteId, Long empresaId) {
        clienteRepository.findByIdAndEmpresaId(clienteId, empresaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado"));
        return abonoRepository.findByClienteIdOrderByFechaDescHoraDesc(clienteId)
                .stream().map(this::toAbonoResponse).collect(Collectors.toList());
    }

    private ClienteResponse toClienteResponse(Cliente c) {
        ClienteResponse r = new ClienteResponse();
        r.setId(c.getId()); r.setNombre(c.getNombre()); r.setTelefono(c.getTelefono());
        r.setDescripcion(c.getDescripcion()); r.setMontoTotal(c.getMontoTotal());
        r.setSaldoPendiente(c.getSaldoPendiente()); r.setFechaInicio(c.getFechaInicio());
        r.setRegistradoPor(c.getRegistradoPor());
        return r;
    }

    private AbonoResponse toAbonoResponse(Abono a) {
        AbonoResponse r = new AbonoResponse();
        r.setId(a.getId()); r.setMonto(a.getMonto()); r.setNota(a.getNota());
        r.setFecha(a.getFecha()); r.setHora(a.getHora());
        r.setRegistradoPor(a.getRegistradoPor()); r.setClienteId(a.getCliente().getId());
        return r;
    }
}