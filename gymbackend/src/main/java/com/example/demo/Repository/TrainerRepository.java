package com.example.demo.Repository;

import com.example.demo.Entity.Trainer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TrainerRepository extends JpaRepository<Trainer, Long> {
    Optional<Trainer> findByEmail(String email);

    List<Trainer> findByStatusIgnoreCase(String status);
}