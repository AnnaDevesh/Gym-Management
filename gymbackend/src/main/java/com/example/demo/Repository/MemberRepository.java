package com.example.demo.Repository;

import com.example.demo.Entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface MemberRepository extends JpaRepository<Member, Long> {
    long countByTrainer_Id(Long trainerId);

    List<Member> findAllByTrainer_Id(Long trainerId);

    boolean existsByEmail(String email);

    List<Member> findByStatusIgnoreCaseAndExpiryDate(String status, LocalDate expiryDate);
}