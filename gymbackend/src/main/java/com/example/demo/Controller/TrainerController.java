package com.example.demo.Controller;

import com.example.demo.Entity.Trainer;
import com.example.demo.Dto.CreateTrainerRequest;
import com.example.demo.Dto.TrainerOption;
import com.example.demo.Service.TrainerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/trainers")
@CrossOrigin(origins = "http://localhost:3000")
public class TrainerController {

    private final TrainerService trainerService;

    public TrainerController(TrainerService trainerService) {
        this.trainerService = trainerService;
    }

    @GetMapping
    public List<Trainer> getAllTrainers() {
        return trainerService.getAllTrainers();
    }

    @GetMapping("/active")
    public List<TrainerOption> getActiveTrainerOptions() {
        return trainerService.getActiveTrainerOptions();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Trainer> getTrainerById(@PathVariable Long id) {

        return trainerService.getTrainerById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Trainer> createTrainer(
            @Valid @RequestBody CreateTrainerRequest request) {

        Trainer savedTrainer = trainerService.createTrainer(request);

        return ResponseEntity.ok(savedTrainer);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(
            IllegalArgumentException exception) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", exception.getMessage()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Trainer> updateTrainer(
            @PathVariable Long id,
            @RequestBody Trainer trainer) {

        Trainer updatedTrainer =
                trainerService.updateTrainer(id, trainer);

        return ResponseEntity.ok(updatedTrainer);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrainer(@PathVariable Long id) {

        trainerService.deleteTrainer(id);

        return ResponseEntity.noContent().build();
    }
}