package com.style.beauty.ms_extra;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(properties = {
		"spring.datasource.url=jdbc:h2:mem:ms_extra_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
		"spring.datasource.hikari.jdbc-url=jdbc:h2:mem:ms_extra_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
		"spring.datasource.driver-class-name=org.h2.Driver",
		"spring.datasource.username=sa",
		"spring.datasource.password=",
		"spring.jpa.hibernate.ddl-auto=create-drop",
		"spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
		"spring.jpa.open-in-view=false",
		"spring.sql.init.mode=never"
})
@ActiveProfiles("test")
class MsExtraApplicationTests {

	@Test
	void contextLoads() {
	}

}
